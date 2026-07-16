#!/usr/bin/env node
/**
 * Generates the reusable Page Designer metadata cartridge without allowing
 * its component types to leak into app_storefrontnext_base.
 */
import { createRequire } from 'node:module';
import { access, copyFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateMetadata } from '@salesforce/storefront-next-dev/cartridge-services';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, '..');
const cartridgeName = 'plugin_sfnext_page_designer';
const componentGroup = 'SFNextToolkit';
// Public component contract. Keeping this explicit prevents a decorator typo or
// parser regression from silently shrinking the Business Manager component set.
const requiredToolkitComponentTypes = [
    'accordion',
    'accordionItem',
    'blogPostGrid',
    'categoryCard',
    'categoryCarousel',
    'categoryHero',
    'contentCollection',
    'embeddedVideo',
    'heroBanner',
    'mediaContent',
    'megaMenu',
    'megaMenuFeature',
    'megaMenuLink',
    'megaMenuPanel',
    'productCard',
    'productCarousel',
    'productList',
    'productRecommendations',
    'promoCard',
    'promoGrid',
    'promoStrip',
    'responsiveColumns',
    'richText',
    'section',
    'siteTheme',
    'sizeGuide',
    'trustBar',
    'trustItem',
];
const contextualToolkitTypeIds = [
    'SFNextToolkit.accordionItem',
    'SFNextToolkit.categoryCard',
    'SFNextToolkit.megaMenu',
    'SFNextToolkit.megaMenuFeature',
    'SFNextToolkit.megaMenuLink',
    'SFNextToolkit.megaMenuPanel',
    'SFNextToolkit.promoCard',
    'SFNextToolkit.siteTheme',
    'SFNextToolkit.sizeGuide',
    'SFNextToolkit.trustItem',
];
const experienceDirectory = join(projectDirectory, 'cartridges', cartridgeName, 'cartridge', 'experience');
const baseExperienceDirectory = join(
    projectDirectory,
    'cartridges',
    'app_storefrontnext_base',
    'cartridge',
    'experience'
);
const pageSourceDirectory = join(projectDirectory, 'src', 'extensions', 'page-designer-toolkit', 'metadata', 'pages');
const editorSourceDirectory = join(
    projectDirectory,
    'src',
    'extensions',
    'page-designer-toolkit',
    'metadata',
    'editors'
);
const componentSourceDirectory = join(projectDirectory, 'src', 'components', 'sfnext-toolkit');
const staticDefaultDirectory = join(projectDirectory, 'cartridges', cartridgeName, 'cartridge', 'static', 'default');

function toPortablePath(path) {
    return path.replaceAll('\\', '/');
}

async function discoverToolkitComponents(directory = componentSourceDirectory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const components = [];

    for (const entry of entries) {
        const absolutePath = join(directory, entry.name);
        if (entry.isDirectory()) {
            components.push(...(await discoverToolkitComponents(absolutePath)));
            continue;
        }

        if (!entry.isFile() || entry.name !== 'index.tsx') continue;

        const source = await readFile(absolutePath, 'utf8');
        const typeId = source.match(/@Component\(\s*['"]([^'"]+)['"]/)?.[1];
        const group = source.match(/group:\s*['"]([^'"]+)['"]/)?.[1];
        if (!typeId || group !== componentGroup) continue;

        components.push({
            source: toPortablePath(relative(projectDirectory, absolutePath)),
            metadata: `components/${componentGroup}/${typeId}.json`,
        });
    }

    return components.sort((left, right) => left.metadata.localeCompare(right.metadata));
}

async function discoverToolkitPages() {
    return (await readdir(pageSourceDirectory))
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => ({
            source: join(pageSourceDirectory, file),
            metadata: `pages/${file}`,
        }));
}

async function discoverToolkitEditors(directory = editorSourceDirectory, prefix = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    const editors = [];

    for (const entry of entries) {
        const absolutePath = join(directory, entry.name);
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
            editors.push(...(await discoverToolkitEditors(absolutePath, relativePath)));
            continue;
        }

        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;

        const scriptName = `${entry.name.slice(0, -'.json'.length)}.js`;
        editors.push({
            source: absolutePath,
            scriptSource: join(directory, scriptName),
            metadata: `editors/${relativePath}`,
            scriptMetadata: `editors/${prefix ? `${prefix}/` : ''}${scriptName}`,
        });
    }

    return editors.sort((left, right) => left.metadata.localeCompare(right.metadata));
}

async function expectedMetadataFiles() {
    const [components, pages, editors] = await Promise.all([
        discoverToolkitComponents(),
        discoverToolkitPages(),
        discoverToolkitEditors(),
    ]);
    return [
        ...components.map(({ metadata }) => metadata),
        ...pages.map(({ metadata }) => metadata),
        ...editors.map(({ metadata }) => metadata),
    ].sort();
}

async function listJsonFiles(directory, prefix = '') {
    let entries;
    try {
        entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
        if (error?.code === 'ENOENT') return [];
        throw error;
    }

    const files = [];
    for (const entry of entries) {
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            files.push(...(await listJsonFiles(join(directory, entry.name), relativePath)));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(relativePath);
        }
    }
    return files.sort();
}

async function loadMetadataValidator() {
    // b2c-tooling-sdk is a direct dependency of storefront-next-dev, but not of
    // every generated storefront. Resolve it from that package so this script
    // remains portable under pnpm's strict dependency layout.
    const storefrontNextDevEntry = fileURLToPath(import.meta.resolve('@salesforce/storefront-next-dev'));
    const storefrontNextDevRequire = createRequire(storefrontNextDevEntry);
    const validatorEntry = storefrontNextDevRequire.resolve('@salesforce/b2c-tooling-sdk/operations/content');
    return import(pathToFileURL(validatorEntry).href);
}

function validateEnumContracts(file, metadata) {
    const failures = [];

    for (const group of metadata.attribute_definition_groups ?? []) {
        for (const attribute of group.attribute_definitions ?? []) {
            if (attribute.type !== 'enum') continue;

            const values = attribute.values;
            if (!Array.isArray(values) || values.length === 0) {
                failures.push(`${file}#${attribute.id}: enum must declare at least one value`);
                continue;
            }

            const unresolvedValue = values.find(
                (value) => typeof value === 'string' && (value.startsWith('...') || value.includes(' as '))
            );
            if (unresolvedValue !== undefined) {
                failures.push(
                    `${file}#${attribute.id}: unresolved TypeScript expression ${JSON.stringify(unresolvedValue)}`
                );
            }

            if (attribute.default_value !== undefined && !values.includes(attribute.default_value)) {
                failures.push(
                    `${file}#${attribute.id}: default ${JSON.stringify(attribute.default_value)} is not in enum values`
                );
            }
        }
    }

    return failures;
}

async function validateContextualRegionContracts() {
    const contracts = [
        [baseExperienceDirectory, 'pages/homePage.json', ['headerbanner', 'main']],
        [baseExperienceDirectory, 'pages/aboutUsPage.json', ['headline', 'additionalinformation']],
        [baseExperienceDirectory, 'pages/productListingPage.json', ['plpTopFullWidth', 'plpTopContent', 'plpBottom']],
        [
            baseExperienceDirectory,
            'pages/searchResultsPage.json',
            ['searchTopFullWidth', 'searchTopContent', 'searchBottom'],
        ],
        [baseExperienceDirectory, 'pages/productDetailPage.json', ['promoContent', 'engagementContent']],
        [baseExperienceDirectory, 'components/Layout/header.json', ['announcement']],
        [
            baseExperienceDirectory,
            'components/Layout/grid.json',
            ['column_1', 'column_2', 'column_3', 'column_4', 'column_5', 'column_6'],
        ],
        [experienceDirectory, 'components/SFNextToolkit/section.json', ['content']],
        [experienceDirectory, 'components/SFNextToolkit/responsiveColumns.json', ['column1', 'column2', 'column3']],
    ];
    const failures = [];

    for (const [directory, file, regionIds] of contracts) {
        const metadata = JSON.parse(await readFile(join(directory, file), 'utf8'));
        for (const regionId of regionIds) {
            const region = metadata.region_definitions?.find((candidate) => candidate.id === regionId);
            if (!region) {
                failures.push(`${file}#${regionId}: required contextual restriction region is missing`);
                continue;
            }
            const exclusions = new Set((region.component_type_exclusions ?? []).map((candidate) => candidate.type_id));
            const missing = contextualToolkitTypeIds.filter((typeId) => !exclusions.has(typeId));
            if (missing.length) {
                failures.push(`${file}#${regionId}: missing contextual exclusions ${missing.join(', ')}`);
            }
        }
    }

    return failures;
}

async function validateProductToolsRegionContracts() {
    const contracts = [
        [baseExperienceDirectory, 'pages/productDetailPage.json'],
        [experienceDirectory, 'pages/sfnextToolkitProductDetailPage.json'],
    ];
    const expectedTypeIds = ['SFNextToolkit.sizeGuide'];
    const failures = [];

    for (const [directory, file] of contracts) {
        const metadata = JSON.parse(await readFile(join(directory, file), 'utf8'));
        const region = metadata.region_definitions?.find((candidate) => candidate.id === 'productTools');
        if (!region) {
            failures.push(`${file}#productTools: required PDP product tools region is missing`);
            continue;
        }

        if (region.max_components !== 1) {
            failures.push(`${file}#productTools: max_components must be 1`);
        }

        const includedTypeIds = (region.component_type_inclusions ?? []).map((candidate) => candidate.type_id).sort();
        if (JSON.stringify(includedTypeIds) !== JSON.stringify(expectedTypeIds)) {
            failures.push(`${file}#productTools: component_type_inclusions must contain only ${expectedTypeIds[0]}`);
        }

        if (region.component_type_exclusions !== undefined) {
            failures.push(`${file}#productTools: component_type_exclusions must not be declared with inclusions`);
        }
    }

    return failures;
}

async function pathExists(path) {
    try {
        await access(path);
        return true;
    } catch (error) {
        if (error?.code === 'ENOENT') return false;
        throw error;
    }
}

function isExternalResource(resource) {
    return resource.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(resource);
}

function resolveLocalResource(resource) {
    const resourcePath = resource.split(/[?#]/, 1)[0].replace(/^\/+/, '');
    if (!resourcePath) return undefined;

    const absolutePath = resolve(staticDefaultDirectory, resourcePath);
    const relativePath = relative(staticDefaultDirectory, absolutePath);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) return undefined;

    return absolutePath;
}

async function validateEditorContracts(file, metadata) {
    const failures = [];
    const serverScript = join(experienceDirectory, file.replace(/\.json$/, '.js'));
    if (!(await pathExists(serverScript))) {
        failures.push(
            `${file}: missing same-name server script ${toPortablePath(relative(projectDirectory, serverScript))}`
        );
    }

    for (const [resourceType, resources] of Object.entries(metadata.resources ?? {})) {
        if (!Array.isArray(resources)) continue;

        for (const resource of resources) {
            if (typeof resource !== 'string' || !resource.trim()) {
                failures.push(`${file}#resources.${resourceType}: resource paths must be non-empty strings`);
                continue;
            }

            const normalizedResource = resource.trim();
            if (isExternalResource(normalizedResource)) continue;

            const localResource = resolveLocalResource(normalizedResource);
            if (!localResource) {
                failures.push(
                    `${file}#resources.${resourceType}: local resource ${JSON.stringify(resource)} must stay within ${toPortablePath(relative(projectDirectory, staticDefaultDirectory))}`
                );
                continue;
            }

            if (!(await pathExists(localResource))) {
                failures.push(
                    `${file}#resources.${resourceType}: local resource ${JSON.stringify(resource)} was not found at ${toPortablePath(relative(projectDirectory, localResource))}`
                );
            }
        }
    }

    return failures;
}

async function validateToolkitCartridge() {
    const expectedFiles = await expectedMetadataFiles();
    const actualFiles = await listJsonFiles(experienceDirectory);
    const requiredComponentFiles = requiredToolkitComponentTypes.map(
        (typeId) => `components/${componentGroup}/${typeId}.json`
    );
    const missingRequiredComponents = requiredComponentFiles.filter((file) => !actualFiles.includes(file));
    const missingFiles = expectedFiles.filter((file) => !actualFiles.includes(file));
    const unexpectedFiles = actualFiles.filter((file) => !expectedFiles.includes(file));

    if (missingRequiredComponents.length || missingFiles.length || unexpectedFiles.length) {
        const details = [
            ...(missingRequiredComponents.length
                ? [`missing required component types: ${missingRequiredComponents.join(', ')}`]
                : []),
            ...(missingFiles.length ? [`missing: ${missingFiles.join(', ')}`] : []),
            ...(unexpectedFiles.length ? [`unexpected: ${unexpectedFiles.join(', ')}`] : []),
        ].join('; ');
        throw new Error(`Unexpected ${cartridgeName} manifest (${details})`);
    }

    const baseFiles = new Set(await listJsonFiles(baseExperienceDirectory));
    const duplicateFiles = actualFiles.filter((file) => baseFiles.has(file));
    if (duplicateFiles.length) {
        throw new Error(`Metadata IDs are present in both cartridges: ${duplicateFiles.join(', ')}`);
    }

    const { validateMetaDefinitionFile } = await loadMetadataValidator();
    const failures = [];
    failures.push(...(await validateContextualRegionContracts()));
    failures.push(...(await validateProductToolsRegionContracts()));

    for (const file of actualFiles) {
        const absolutePath = join(experienceDirectory, file);
        const result = validateMetaDefinitionFile(absolutePath);
        if (!result.valid) {
            failures.push(
                `${file}: ${result.errors.map((error) => `${error.path || '/'} ${error.message}`).join('; ')}`
            );
        }

        const metadata = JSON.parse(await readFile(absolutePath, 'utf8'));
        failures.push(...validateEnumContracts(file, metadata));
        if (file.startsWith('editors/')) {
            failures.push(...(await validateEditorContracts(file, metadata)));
        }
    }

    if (failures.length) {
        throw new Error(`Page Designer metadata validation failed:\n${failures.join('\n')}`);
    }

    console.log(`Validated ${actualFiles.length} ${cartridgeName} metadata files.`);
}

async function syncToolkitCartridge() {
    const [components, pages, editors] = await Promise.all([
        discoverToolkitComponents(),
        discoverToolkitPages(),
        discoverToolkitEditors(),
    ]);
    const missingEditorScripts = [];
    for (const editor of editors) {
        if (!(await pathExists(editor.scriptSource))) {
            missingEditorScripts.push(toPortablePath(relative(projectDirectory, editor.scriptSource)));
        }
    }
    if (missingEditorScripts.length) {
        throw new Error(`Editor definitions are missing same-name server scripts: ${missingEditorScripts.join(', ')}`);
    }

    await rm(experienceDirectory, { recursive: true, force: true });
    await mkdir(experienceDirectory, { recursive: true });

    if (!components.length) {
        throw new Error(`No @Component decorators in group ${componentGroup} were found.`);
    }

    await generateMetadata(projectDirectory, experienceDirectory, {
        filePaths: components.map(({ source }) => source),
        lintFix: true,
    });

    const pagesOutputDirectory = join(experienceDirectory, 'pages');
    await mkdir(pagesOutputDirectory, { recursive: true });
    for (const page of pages) {
        await copyFile(page.source, join(experienceDirectory, page.metadata));
    }

    for (const editor of editors) {
        const metadataOutput = join(experienceDirectory, editor.metadata);
        const scriptOutput = join(experienceDirectory, editor.scriptMetadata);
        await mkdir(dirname(metadataOutput), { recursive: true });
        await copyFile(editor.source, metadataOutput);
        await copyFile(editor.scriptSource, scriptOutput);
    }

    // The stock generator scans every decorated component into the base
    // cartridge. Remove only this toolkit-owned group after base generation.
    await rm(join(baseExperienceDirectory, 'components', componentGroup), { recursive: true, force: true });

    await validateToolkitCartridge();
    console.log(`Synced ${relative(projectDirectory, experienceDirectory)}.`);
}

if (process.argv.includes('--validate-only')) {
    await validateToolkitCartridge();
} else {
    await syncToolkitCartridge();
}
