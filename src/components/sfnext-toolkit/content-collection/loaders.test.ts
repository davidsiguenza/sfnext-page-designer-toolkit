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

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createApiClients } from '@/lib/api-clients.server';
import { loader, prepareLatestItems } from './loaders';

const loggerMocks = vi.hoisted(() => {
    const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    return { logger, getLogger: vi.fn(() => logger) };
});

vi.mock('@/lib/api-clients.server', () => ({ createApiClients: vi.fn() }));
vi.mock('@/lib/logger.server', () => ({ getLogger: loggerMocks.getLogger }));

const getMultipleContent = vi.fn();
const searchContent = vi.fn();
const context = {} as never;

describe('SFNext Toolkit content collection loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createApiClients).mockReturnValue({
            shopperExperience: { getMultipleContent, searchContent },
        } as never);
    });

    test('loads selected IDs once, preserves authored order and reports unavailable assets', async () => {
        getMultipleContent.mockResolvedValue({
            data: {
                data: [
                    { id: 'second.item', name: 'Second', c_url: '/second' },
                    { id: 'first item', name: 'First', c_url: '/first' },
                ],
            },
        });

        const result = await loader({
            componentData: {
                data: {
                    sourceMode: 'manual',
                    selectedContentIds: 'first item\nsecond.item\nmissing',
                    limit: 3,
                },
            },
            context,
        });

        expect(getMultipleContent).toHaveBeenCalledWith({
            params: { query: { ids: ['first item', 'second.item', 'missing'] } },
        });
        expect(searchContent).not.toHaveBeenCalled();
        expect(result.items.map((item) => item.id)).toEqual(['first item', 'second.item']);
        expect(result).toMatchObject({
            sourceMode: 'manual',
            status: 'ready',
            missingIds: ['missing'],
            invalidIdCount: 0,
        });
    });

    test('searches a folder in latest mode, filters content kind and returns the newest N items', async () => {
        searchContent.mockResolvedValue({
            data: {
                total: 3,
                hits: [
                    {
                        id: 'old-blog',
                        name: 'Old blog',
                        c_sfnextBlogBody: '<p>Old</p>',
                        c_sfnextBlogPublishedAt: '2026-01-01T00:00:00.000Z',
                    },
                    { id: 'generic', name: 'Generic', creationDate: '2026-05-01T00:00:00.000Z' },
                    {
                        id: 'new-blog',
                        name: 'New blog',
                        c_sfnextBlogBody: '<p>New</p>',
                        c_sfnextBlogPublishedAt: '2026-06-01T00:00:00.000Z',
                    },
                ],
            },
        });

        const result = await loader({
            componentData: {
                data: {
                    sourceMode: 'latest',
                    folderId: ' editorial ',
                    contentType: 'blog',
                    sort: 'newest',
                    limit: 1,
                },
            },
            context,
        });

        expect(searchContent).toHaveBeenCalledWith({
            params: { query: { refine: 'fdid=editorial', limit: 200, offset: 0 } },
        });
        expect(result.items.map((item) => item.id)).toEqual(['new-blog']);
        expect(result).toMatchObject({ status: 'ready', filteredCount: 1, searchTruncated: false });
    });

    test('keeps deterministic title and date sorting separate from manual ordering', () => {
        const items = [
            { id: 'z', kind: 'generic' as const, title: 'Zebra', publishedAt: '2026-01-01T00:00:00.000Z' },
            { id: 'a', kind: 'generic' as const, title: 'Alpha', publishedAt: '2026-03-01T00:00:00.000Z' },
        ];

        expect(
            prepareLatestItems(items, { filter: 'all', sort: 'newest', limit: 2 }).items.map((item) => item.id)
        ).toEqual(['a', 'z']);
        expect(
            prepareLatestItems(items, { filter: 'all', sort: 'title', limit: 2 }).items.map((item) => item.id)
        ).toEqual(['a', 'z']);
    });

    test('does not call SCAPI for missing manual IDs or refinement injection', async () => {
        await expect(
            loader({ componentData: { data: { sourceMode: 'manual', selectedContentIds: '' } }, context })
        ).resolves.toMatchObject({ status: 'unconfigured', sourceMode: 'manual' });
        await expect(
            loader({ componentData: { data: { sourceMode: 'latest', folderId: 'folder|private' } }, context })
        ).resolves.toMatchObject({ status: 'unconfigured', sourceMode: 'latest' });

        expect(createApiClients).not.toHaveBeenCalled();
    });

    test('returns a stable error result and logs only the error type', async () => {
        getMultipleContent.mockRejectedValue(new TypeError('secret upstream body'));

        const result = await loader({
            componentData: { data: { sourceMode: 'manual', selectedContentIds: 'one' } },
            context,
        });

        expect(result).toMatchObject({ items: [], status: 'error', sourceMode: 'manual' });
        expect(loggerMocks.logger.warn).toHaveBeenCalledWith('SFNext Toolkit manual content collection failed', {
            sourceMode: 'manual',
            error: 'TypeError',
        });
        expect(loggerMocks.logger.warn).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ error: 'secret upstream body' })
        );
    });

    test('bounds latest-mode folder scans to five SCAPI requests and reports truncation', async () => {
        searchContent.mockImplementation(({ params }: { params: { query: { offset: number; limit: number } } }) => {
            const { offset, limit } = params.query;
            return Promise.resolve({
                data: {
                    total: 5_000,
                    hits: Array.from({ length: limit }, (_, index) => ({
                        id: `asset-${offset + index}`,
                        name: `Asset ${offset + index}`,
                    })),
                },
            });
        });

        const result = await loader({
            componentData: { data: { sourceMode: 'latest', folderId: 'editorial', limit: 6 } },
            context,
        });

        expect(searchContent).toHaveBeenCalledTimes(5);
        expect(searchContent).toHaveBeenLastCalledWith({
            params: { query: { refine: 'fdid=editorial', limit: 200, offset: 800 } },
        });
        expect(result).toMatchObject({ status: 'ready', searchTruncated: true });
        expect(result.items).toHaveLength(6);
    });
});
