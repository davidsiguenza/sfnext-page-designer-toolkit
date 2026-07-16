/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, test } from 'vitest';
import { MAYORAL_APPAREL_SIZES, MAYORAL_FOOTWEAR_SIZES, SIZE_GUIDE_DATASET_VERSION } from './data';
import { measurementToMillimeters, recommendMayoralSize, type SizeRecommendationInput } from './recommendation';

const ALL_APPAREL_SIZES = MAYORAL_APPAREL_SIZES.map((row) => row.size);
const ALL_FOOTWEAR_SIZES = MAYORAL_FOOTWEAR_SIZES.map((row) => row.size);

function apparelInput(overrides: Partial<SizeRecommendationInput> = {}): SizeRecommendationInput {
    return {
        target: { audience: 'kids', category: 'clothing' },
        availableSizes: ALL_APPAREL_SIZES,
        ...overrides,
    };
}

function footwearInput(overrides: Partial<SizeRecommendationInput> = {}): SizeRecommendationInput {
    return {
        target: { audience: 'kids', category: 'footwear' },
        availableSizes: ALL_FOOTWEAR_SIZES,
        ...overrides,
    };
}

describe('SFNext Toolkit Mayoral size recommendation engine', () => {
    test('uses the versioned dataset and normalizes localized centimetres and millimetres', () => {
        expect(SIZE_GUIDE_DATASET_VERSION).toBe('2026-07-16');
        expect(measurementToMillimeters('14,5')).toBe(145);
        expect(measurementToMillimeters({ value: '145', unit: 'mm' })).toBe(145);
        expect(measurementToMillimeters({ value: 14.54, unit: 'cm' })).toBe(145.4);
        expect(measurementToMillimeters('14,5 cm')).toBeUndefined();
        expect(measurementToMillimeters(0)).toBeUndefined();
    });

    test('recommends Mayoral 8 when height and chest agree', () => {
        const result = recommendMayoralSize(apparelInput({ measurements: { height: 128, chest: 65 }, ageYears: 10 }));

        expect(result).toMatchObject({
            datasetVersion: '2026-07-16',
            status: 'recommended',
            confidence: 'medium-high',
            recommendedSize: '8',
            alternativeSizes: [],
            missingMeasurements: [],
        });
        expect(result.evidence.join(' ')).toContain('La altura de 128 cm');
    });

    test('uses the most restrictive apparel measurement and preserves the adjacent alternative', () => {
        const result = recommendMayoralSize(apparelInput({ measurements: { height: 128, chest: 69 } }));

        expect(result).toMatchObject({
            status: 'recommended_with_alternative',
            confidence: 'medium-high',
            recommendedSize: '10',
            alternativeSizes: ['8'],
        });
        expect(result.evidence.join(' ')).toContain('medida más restrictiva');
    });

    test('shows both adjacent apparel sizes when height falls between Mayoral references', () => {
        const result = recommendMayoralSize(apparelInput({ measurements: { height: 122 } }));

        expect(result).toMatchObject({
            status: 'needs_confirmation',
            confidence: 'low',
            recommendedSize: '8',
            alternativeSizes: ['6'],
            missingMeasurements: ['chest'],
        });
        expect(result.evidence.join(' ')).toContain('queda entre la talla 6');
        expect(result.evidence.join(' ')).toContain('confirma el ajuste');
    });

    test('lets an exact secondary measure close a between-height range', () => {
        const result = recommendMayoralSize(apparelInput({ measurements: { height: 122, chest: 65 } }));

        expect(result).toMatchObject({
            status: 'recommended',
            confidence: 'medium-high',
            recommendedSize: '8',
            alternativeSizes: [],
            missingMeasurements: [],
        });
        expect(result.evidence.join(' ')).toContain('medida más restrictiva resuelve la duda');
    });

    test('does not preserve an alternative when a restrictive exact axis closes an open range', () => {
        const result = recommendMayoralSize(apparelInput({ measurements: { height: 122, chest: 69 } }));

        expect(result).toMatchObject({
            status: 'recommended',
            confidence: 'medium-high',
            recommendedSize: '10',
            alternativeSizes: [],
        });
        expect(result.evidence.join(' ')).toContain('medida más restrictiva resuelve la duda');
    });

    test('combines two open apparel ranges restrictively without leaking a globally invalid size', () => {
        const result = recommendMayoralSize(apparelInput({ measurements: { height: 122, chest: 67 } }));

        expect(result).toMatchObject({
            status: 'needs_confirmation',
            confidence: 'low',
            recommendedSize: '10',
            alternativeSizes: ['8'],
            missingMeasurements: [],
        });
        expect(result.alternativeSizes).not.toContain('6');
    });

    test('requires confirmation when body measurements differ by more than one Mayoral step', () => {
        const result = recommendMayoralSize(apparelInput({ measurements: { height: 128, chest: 73 } }));

        expect(result).toMatchObject({
            status: 'needs_confirmation',
            confidence: 'low',
            recommendedSize: '12',
            alternativeSizes: [],
        });
        expect(result.evidence.join(' ')).toContain('tallas separadas');
    });

    test('uses height and inseam for bottoms rather than chest', () => {
        const result = recommendMayoralSize(
            apparelInput({
                target: { audience: 'kids', category: 'bottoms' },
                measurements: { height: 128, chest: 73, inseam: 61 },
            })
        );

        expect(result).toMatchObject({ status: 'recommended', recommendedSize: '8' });
        expect(result.evidence.join(' ')).toContain('La entrepierna de 61 cm');
        expect(result.evidence.join(' ')).not.toContain('El pecho de 73 cm');
    });

    test.each([37.5, 37.75, 38])('keeps %s cm inside the published Mayoral size-2 inseam range', (inseam) => {
        const result = recommendMayoralSize(
            apparelInput({
                target: { audience: 'kids', category: 'bottoms' },
                measurements: { height: 92, inseam },
            })
        );

        expect(result).toMatchObject({
            status: 'recommended',
            confidence: 'medium-high',
            recommendedSize: '2',
            alternativeSizes: [],
        });
        expect(result.evidence.join(' ')).toContain('referencia 37,5–38 cm');
    });

    test('opens a size-2/3 result immediately above the published size-2 inseam range', () => {
        const result = recommendMayoralSize(
            apparelInput({
                target: { audience: 'kids', category: 'bottoms' },
                measurements: { height: 92, inseam: 38.01 },
            })
        );

        expect(result).toMatchObject({
            status: 'needs_confirmation',
            confidence: 'low',
            recommendedSize: '3',
            alternativeSizes: ['2'],
        });
        expect(result.evidence.join(' ')).toContain('queda entre la talla 2');
    });

    test('recognizes the exact lower boundary of the next inseam row', () => {
        const result = recommendMayoralSize(
            apparelInput({
                target: { audience: 'kids', category: 'bottoms' },
                measurements: { height: 98, inseam: 41.5 },
            })
        );

        expect(result).toMatchObject({
            status: 'recommended',
            confidence: 'medium-high',
            recommendedSize: '3',
            alternativeSizes: [],
        });
    });

    test('fails closed instead of extrapolating apparel measurements', () => {
        const below = recommendMayoralSize(apparelInput({ measurements: { height: 91.99 } }));
        const above = recommendMayoralSize(apparelInput({ measurements: { height: 162.01 } }));

        expect(below.status).toBe('out_of_coverage');
        expect(above.status).toBe('out_of_coverage');
        expect(below.recommendedSize).toBeUndefined();
        expect(above.recommendedSize).toBeUndefined();
    });

    test('recognizes an exact Boston x Mayoral collection match', () => {
        const result = recommendMayoralSize(
            apparelInput({
                target: { audience: 'kids', category: 'clothing', collection: 'Boston x Mayoral' },
                measurements: { height: 128, chest: 66.5, waist: 60, hip: 70 },
            })
        );

        expect(result).toMatchObject({ status: 'recommended', confidence: 'high', recommendedSize: '8' });
        expect(result.evidence.join(' ')).toContain('tabla específica Boston x Mayoral');
    });

    test('maps the reviewed adidas child size to Mayoral 8', () => {
        const result = recommendMayoralSize(
            apparelInput({
                knownSize: {
                    brand: 'adidas',
                    audience: 'kids',
                    category: 'clothing',
                    size: '7–8 años / 128',
                },
            })
        );

        expect(result).toMatchObject({
            status: 'recommended',
            confidence: 'medium',
            recommendedSize: '8',
            alternativeSizes: [],
        });
    });

    test('maps Nike S to Mayoral 10 with 8 as an honest alternative', () => {
        const result = recommendMayoralSize(
            apparelInput({
                knownSize: { brand: 'Nike', audience: 'kids', category: 'clothing', size: 'S / 8–10' },
            })
        );

        expect(result).toMatchObject({
            status: 'recommended_with_alternative',
            confidence: 'medium',
            recommendedSize: '10',
            alternativeSizes: ['8'],
            missingMeasurements: ['height', 'chest'],
        });
    });

    test('maps the reviewed Vans boys size to Mayoral 10 with 8 as alternative', () => {
        const result = recommendMayoralSize(
            apparelInput({
                knownSize: {
                    brand: 'Vans',
                    audience: 'kids',
                    category: 'clothing',
                    size: 'Chicos S / US 8',
                },
            })
        );

        expect(result).toMatchObject({
            status: 'recommended_with_alternative',
            recommendedSize: '10',
            alternativeSizes: ['8'],
        });
    });

    test('keeps the broad Vans girls conversion orientative until height and chest are supplied', () => {
        const result = recommendMayoralSize(
            apparelInput({
                knownSize: {
                    brand: 'Vans',
                    audience: 'kids',
                    category: 'clothing',
                    size: 'Chicas S / US 7–8',
                },
            })
        );

        expect(result).toMatchObject({
            status: 'needs_measurement',
            confidence: 'low',
            recommendedSize: '10',
            alternativeSizes: ['8', '12'],
            missingMeasurements: ['height', 'chest'],
        });
    });

    test('does not invent a conversion for a source size missing from the dataset', () => {
        const result = recommendMayoralSize(
            apparelInput({
                knownSize: { brand: 'Nike', audience: 'kids', category: 'clothing', size: 'M' },
            })
        );

        expect(result).toMatchObject({
            status: 'needs_measurement',
            confidence: 'none',
            missingMeasurements: ['height'],
        });
        expect(result.recommendedSize).toBeUndefined();
        expect(result.evidence.join(' ')).toContain('No hay una equivalencia infantil oficial cargada');
    });

    test('rejects a known size that does not fit or belongs to an adult table', () => {
        const doesNotFit = recommendMayoralSize(
            apparelInput({
                knownSize: {
                    brand: 'Nike',
                    audience: 'kids',
                    category: 'clothing',
                    size: 'S',
                    fitsWell: false,
                },
            })
        );
        const adult = recommendMayoralSize(
            apparelInput({
                knownSize: { brand: 'Nike', audience: 'adult', category: 'clothing', size: 'S' },
            })
        );

        expect(doesNotFit.status).toBe('needs_measurement');
        expect(adult.status).toBe('needs_measurement');
        expect(adult.evidence.join(' ')).toContain('No se mezclan tablas de adulto');
    });

    test.each([
        [14.2, '23'],
        [14.8, '24'],
        [15.4, '25'],
    ])('maps an exact physical foot reference of %s cm to Mayoral %s', (footLength, expectedSize) => {
        const result = recommendMayoralSize(footwearInput({ measurements: { footLength } }));

        expect(result).toMatchObject({
            status: 'recommended',
            confidence: 'medium-high',
            recommendedSize: expectedSize,
        });
    });

    test.each([
        [14.21, '24', '23'],
        [14.5, '24', '23'],
        [14.9, '25', '24'],
        [18.9, '31', '30'],
    ])(
        'keeps both Mayoral candidates when %s cm falls between %s and %s',
        (footLength, expectedSize, alternativeSize) => {
            const result = recommendMayoralSize(footwearInput({ measurements: { footLength } }));

            expect(result).toMatchObject({
                status: 'needs_confirmation',
                confidence: 'medium',
                recommendedSize: expectedSize,
                alternativeSizes: [alternativeSize],
            });
            expect(result.evidence.join(' ')).toContain('La medida queda entre la talla');
        }
    );

    test('uses the longer of both feet', () => {
        const result = recommendMayoralSize(
            footwearInput({ measurements: { leftFootLength: 14.2, rightFootLength: '14,5' } })
        );

        expect(result).toMatchObject({
            status: 'needs_confirmation',
            recommendedSize: '24',
            alternativeSizes: ['23'],
        });
        expect(result.evidence[0]).toBe('Se usa el pie más largo: 14,5 cm.');
    });

    test.each(['Vans', 'adidas', 'New Balance'])(
        '%s child EU 25 maps through 14.5 cm to Mayoral 24 with 23 disclosed',
        (brand) => {
            const result = recommendMayoralSize(
                footwearInput({
                    knownSize: {
                        brand,
                        audience: 'kids',
                        category: 'footwear',
                        sizeSystem: 'eu',
                        size: 'EU 25',
                    },
                })
            );

            expect(result).toMatchObject({
                status: 'needs_confirmation',
                confidence: 'low',
                recommendedSize: '24',
                alternativeSizes: ['23'],
            });
            expect(result.evidence.join(' ')).toContain('no se copia directamente la etiqueta EU');
        }
    );

    test('reports the unresolved Mayoral size-30 discrepancy for 18.6 cm', () => {
        const result = recommendMayoralSize(footwearInput({ measurements: { footLength: 18.6 } }));

        expect(result).toMatchObject({
            status: 'needs_confirmation',
            confidence: 'low',
            alternativeSizes: ['30', '31'],
        });
        expect(result.recommendedSize).toBeUndefined();
        expect(result.evidence.join(' ')).toContain('conflicto publicado para la talla 30');
    });

    test('fails closed outside the Mayoral footwear range', () => {
        const below = recommendMayoralSize(footwearInput({ measurements: { footLength: 11.1 } }));
        const above = recommendMayoralSize(footwearInput({ measurements: { footLength: 22.3 } }));

        expect(below.status).toBe('out_of_coverage');
        expect(above.status).toBe('out_of_coverage');
    });

    test('reports the ideal size without silently substituting an available one', () => {
        const result = recommendMayoralSize(
            footwearInput({ measurements: { footLength: 14.5 }, availableSizes: ['23', '25'] })
        );

        expect(result).toMatchObject({
            status: 'needs_confirmation',
            recommendedSize: '24',
            alternativeSizes: ['23'],
        });
        expect(result.evidence.join(' ')).toContain('La talla ideal 24 no está disponible');
    });

    test('lets a physical foot measurement prevail over a conflicting brand conversion', () => {
        const result = recommendMayoralSize(
            footwearInput({
                measurements: { footLength: 15.4 },
                knownSize: { brand: 'Vans', audience: 'kids', category: 'footwear', size: 'EU 25' },
            })
        );

        expect(result).toMatchObject({
            status: 'needs_confirmation',
            confidence: 'medium',
            recommendedSize: '25',
            alternativeSizes: ['24'],
        });
        expect(result.evidence.join(' ')).toContain('prevalece la medida física');
    });

    test('lets physical apparel measurements prevail over an adjacent brand estimate', () => {
        const result = recommendMayoralSize(
            apparelInput({
                measurements: { height: 128, chest: 65 },
                knownSize: { brand: 'Nike', audience: 'kids', category: 'clothing', size: 'S' },
            })
        );

        expect(result).toMatchObject({
            status: 'recommended_with_alternative',
            confidence: 'medium',
            recommendedSize: '8',
            alternativeSizes: ['10'],
        });
    });

    test('keeps age-only recommendations explicitly low-confidence', () => {
        const between = recommendMayoralSize(apparelInput({ ageYears: 5 }));
        const exact = recommendMayoralSize(apparelInput({ ageYears: 8 }));

        expect(between).toMatchObject({
            status: 'needs_confirmation',
            confidence: 'low',
            recommendedSize: '6',
            alternativeSizes: ['4'],
            missingMeasurements: ['height'],
        });
        expect(exact).toMatchObject({ status: 'needs_confirmation', confidence: 'low', recommendedSize: '8' });
    });

    test('does not use age to recommend footwear or override a physical apparel result', () => {
        const footwear = recommendMayoralSize(footwearInput({ ageYears: 8 }));
        const apparel = recommendMayoralSize(apparelInput({ ageYears: 10, measurements: { height: 128, chest: 65 } }));

        expect(footwear).toMatchObject({ status: 'needs_measurement', missingMeasurements: ['footLength'] });
        expect(apparel.recommendedSize).toBe('8');
    });

    test('validates source category and target audience before converting', () => {
        const categoryMismatch = recommendMayoralSize(
            apparelInput({
                knownSize: { brand: 'Vans', audience: 'kids', category: 'footwear', size: 'EU 25' },
            })
        );
        const unsupportedAudience = recommendMayoralSize(
            apparelInput({ target: { audience: 'baby', category: 'clothing' }, ageYears: 1 })
        );

        expect(categoryMismatch.status).toBe('needs_measurement');
        expect(categoryMismatch.evidence.join(' ')).toContain('categoría');
        expect(unsupportedAudience.status).toBe('out_of_coverage');
    });

    test('normalizes common availability labels but never chooses a different size', () => {
        const available = recommendMayoralSize(
            footwearInput({ measurements: { footLength: 14.5 }, availableSizes: ['EU 24'] })
        );
        const zeroPadded = recommendMayoralSize(
            apparelInput({ measurements: { height: 128, chest: 65 }, availableSizes: ['008'] })
        );
        const noInput = recommendMayoralSize(apparelInput());

        expect(available).toMatchObject({
            status: 'needs_confirmation',
            recommendedSize: '24',
            alternativeSizes: ['23'],
        });
        expect(zeroPadded).toMatchObject({ status: 'recommended', recommendedSize: '8' });
        expect(noInput).toMatchObject({
            status: 'needs_measurement',
            confidence: 'none',
            missingMeasurements: ['height'],
        });
    });
});
