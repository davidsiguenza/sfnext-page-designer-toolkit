#!/usr/bin/env node
/**
 * Generates the reusable Page Designer metadata cartridge without allowing
 * its component types to leak into app_storefrontnext_base.
 */
import { createRequire } from 'node:module';
import { copyFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateMetadata } from '@salesforce/storefront-next-dev/cartridge-services';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, '..');
const cartridgeName = 'plugin_sfnext_page_designer';
const componentGroup = 'SFNextToolkit';
const experienceDirectory = join(projectDirectory, 'cartridges', cartridgeName, 'cartridge', 'experience');
const baseExperienceDirectory = join(
    projectDirectory,
    'cartridges',
    'app_storefrontnext_base',
    'cartridge',
    'experience'
);
const pageSourceDirectory = join(projectDirectory, 'src', 'extensions', 'page-designer-toolkit', 'metadata', 'pages');
const componentSourceDirectory = join(projectDirectory, 'src', 'components', 'sfnext-toolkit');

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

async function expectedMetadataFiles() {
    const [components, pages] = await Promise.all([discoverToolkitComponents(), discoverToolkitPages()]);
    return [...components.map(({ metadata }) => metadata), ...pages.map(({ metadata }) => metadata)].sort();
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

async function validateToolkitCartridge() {
    const expectedFiles = await expectedMetadataFiles();
    const actualFiles = await listJsonFiles(experienceDirectory);
    const missingFiles = expectedFiles.filter((file) => !actualFiles.includes(file));
    const unexpectedFiles = actualFiles.filter((file) => !expectedFiles.includes(file));

    if (missingFiles.length || unexpectedFiles.length) {
        const details = [
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

    for (const file of actualFiles) {
        const absolutePath = join(experienceDirectory, file);
        const result = validateMetaDefinitionFile(absolutePath);
        if (!result.valid) {
            failures.push(
                `${file}: ${result.errors.map((error) => `${error.path || '/'} ${error.message}`).join('; ')}`
            );
        }
    }

    if (failures.length) {
        throw new Error(`Page Designer metadata validation failed:\n${failures.join('\n')}`);
    }

    console.log(`Validated ${actualFiles.length} ${cartridgeName} metadata files.`);
}

async function syncToolkitCartridge() {
    await rm(experienceDirectory, { recursive: true, force: true });
    await mkdir(experienceDirectory, { recursive: true });

    const components = await discoverToolkitComponents();
    if (!components.length) {
        throw new Error(`No @Component decorators in group ${componentGroup} were found.`);
    }

    await generateMetadata(projectDirectory, experienceDirectory, {
        filePaths: components.map(({ source }) => source),
        lintFix: true,
    });

    const pagesOutputDirectory = join(experienceDirectory, 'pages');
    await mkdir(pagesOutputDirectory, { recursive: true });
    for (const page of await discoverToolkitPages()) {
        await copyFile(page.source, join(experienceDirectory, page.metadata));
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
