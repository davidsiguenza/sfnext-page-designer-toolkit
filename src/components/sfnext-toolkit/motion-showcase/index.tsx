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
/** @sfdc-extension-file SFDC_EXT_PAGE_DESIGNER_TOOLKIT */
import { useEffect, useMemo, useRef } from 'react';
import { usePageDesignerMode } from '@salesforce/storefront-next-runtime/design/react/core';
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import type { Image } from '@/types';
import MediaContent, { type MediaContentProps } from '../media-content';
import { normalizeMotion, type MotionValue } from './model';
import { activateMotion } from './runtime';

/* v8 ignore start - decorator output is asserted through the metadata contract test. */
@Component('motionShowcase', {
    name: 'Motion Showcase · Media + Content',
    description:
        'Animated editorial content whose effect, duration, curve, delay, sequence and trigger use controlled design-system tokens.',
    group: 'SFNextToolkit',
})
@RegionDefinition([])
export class SFNextToolkitMotionShowcaseMetadata {
    @AttributeDefinition({ id: 'imageUrl', name: 'Image', type: 'image', required: true })
    imageUrl?: Image;

    @AttributeDefinition({
        id: 'imageAlt',
        name: 'Image Alt Text',
        description: 'Describe informative images. When empty, the heading is used.',
        type: 'string',
    })
    imageAlt?: string;

    @AttributeDefinition({ id: 'eyebrow', name: 'Eyebrow', type: 'string' })
    eyebrow?: string;

    @AttributeDefinition({ id: 'heading', name: 'Heading', type: 'string', required: true })
    heading?: string;

    @AttributeDefinition({
        id: 'headingLevel',
        name: 'Heading Level',
        type: 'enum',
        values: ['h2', 'h3', 'h4'],
        defaultValue: 'h2',
    })
    headingLevel?: string;

    @AttributeDefinition({ id: 'content', name: 'Content', type: 'markup' })
    content?: string;

    @AttributeDefinition({ id: 'ctaLabel', name: 'CTA Label', type: 'string' })
    ctaLabel?: string;

    @AttributeDefinition({ id: 'ctaUrl', name: 'CTA URL', type: 'url' })
    ctaUrl?: string;

    @AttributeDefinition({
        id: 'ctaStyle',
        name: 'CTA Style',
        type: 'enum',
        values: ['primary', 'secondary', 'outline', 'link'],
        defaultValue: 'primary',
    })
    ctaStyle?: string;

    @AttributeDefinition({
        id: 'mediaPosition',
        name: 'Desktop Image Position',
        type: 'enum',
        values: ['left', 'right'],
        defaultValue: 'left',
    })
    mediaPosition?: string;

    @AttributeDefinition({
        id: 'mediaRatio',
        name: 'Image Ratio',
        type: 'enum',
        values: ['landscape', 'square', 'portrait', 'auto'],
        defaultValue: 'landscape',
    })
    mediaRatio?: string;

    @AttributeDefinition({
        id: 'surface',
        name: 'Surface',
        type: 'enum',
        values: ['transparent', 'background', 'muted', 'card', 'secondary'],
        defaultValue: 'card',
    })
    surface?: string;

    @AttributeDefinition({
        id: 'contentAlignment',
        name: 'Vertical Content Alignment',
        type: 'enum',
        values: ['start', 'center', 'end'],
        defaultValue: 'center',
    })
    contentAlignment?: string;

    @AttributeDefinition({
        id: 'contentSpacing',
        name: 'Content Spacing',
        type: 'enum',
        values: ['sm', 'md', 'lg'],
        defaultValue: 'md',
    })
    contentSpacing?: string;

    @AttributeDefinition({
        id: 'motion',
        name: 'Motion Settings',
        description: 'Open the visual editor to configure reusable motion design tokens and replay the preview.',
        type: 'custom',
        required: false,
        editorDefinition: {
            type: 'SFNextToolkit.motionEditor',
            configuration: { schemaVersion: 1 },
        },
    })
    motion?: MotionValue;
}
/* v8 ignore stop */

export interface MotionShowcaseProps extends MediaContentProps {
    motion?: MotionValue | string | null;
}

export default function MotionShowcase({ motion, ...props }: MotionShowcaseProps) {
    const rootRef = useRef<HTMLElement>(null);
    const { isDesignMode } = usePageDesignerMode();
    const normalizedMotion = useMemo(() => normalizeMotion(motion), [motion]);
    const motionDisabled = isDesignMode;

    useEffect(() => {
        if (!rootRef.current) return undefined;
        return activateMotion(rootRef.current, normalizedMotion, motionDisabled);
    }, [motionDisabled, normalizedMotion]);

    return (
        <MediaContent
            {...props}
            ref={rootRef}
            data-motion-showcase=""
            data-motion-root=""
            data-motion-effect={normalizedMotion.effect}
            data-motion-duration={normalizedMotion.duration}
            data-motion-easing={normalizedMotion.easing}
            data-motion-delay={normalizedMotion.delay}
            data-motion-sequence={normalizedMotion.sequence}
            data-motion-stagger={normalizedMotion.stagger}
            data-motion-trigger={normalizedMotion.trigger}
            data-motion-replay={normalizedMotion.replay ? 'true' : 'false'}
            data-motion-authoring-disabled={motionDisabled ? 'true' : undefined}
        />
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { DEFAULT_MOTION, MOTION_OPTIONS, normalizeMotion } from './model';
