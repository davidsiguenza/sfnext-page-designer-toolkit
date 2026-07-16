# Reusable blog metadata for SFNext Toolkit

This package contains only the site-independent metadata required by the Storefront Next blog templates. It intentionally does not include a site library, Page Designer page instances, article copy, images, catalog IDs, locale preferences, or brand assets.

## Included metadata

- A `Content` system-object extension with the `SFNextBlog` attribute group.
- Localizable fields for the article body, hero image and alternative text, author, publication date, category, tags, reading time, and featured state.

## Where editors write posts

Posts are **Content Assets**, not Custom Objects. Editors create and maintain them in Business Manager under:

`Merchant Tools > Content > Libraries > <your library> > Content Assets`

The title and summary use the standard `Name` and `Description` fields. The body, image, author, date, category, tags, reading time, and featured state appear together in the **SFNext Blog** attribute group after this metadata is imported.

Content Assets are the preferred editorial model because they already provide localization, folders, online scheduling, search indexing, images, and Shopper Experience API access. Custom Objects are better suited to structured operational data; using them for posts would require a separate editor, search implementation, and API exposure.

## Installation order

1. Generate and deploy `plugin_sfnext_page_designer`, including the `sfnextToolkitBlogHomePage` and `sfnextToolkitBlogPostPage` page types plus the `SFNextToolkit.blogPostGrid` and `SFNextToolkit.contentCollection` components.
2. Zip this directory with `meta/` at the archive root and import it through **Administration > Site Development > Site Import & Export**, or use B2C CLI.
3. In the target site's content library, create a folder whose ID is `sfnext-blog` (or configure another folder ID on Blog Post Grid).
4. Create online Content Assets in that folder and complete the standard fields plus the **SFNext Blog** fields. Keep each Content Asset ID URL-safe because it becomes the post slug.
5. In Page Designer, create a blog-home page with ID `blog` and type `SFNext Toolkit Blog Home`; add Blog Post Grid for a pageable index or Content Collection in Latest mode for the newest N posts to its `posts` region. Use a Manual Content Collection when the author must choose and order exact posts.
6. Create the shared post-layout page with ID `blog-post-layout` and type `SFNext Toolkit Blog Post`.
7. Preserve the Storefront Next SLAS client's existing scopes, add `sfcc.shopper-experience.contents`, confirm that the instance allows the Shopper Experience content resources, and rebuild the target site's content search index.

The storefront routes are `/{siteRef}/{localeRef}/blog`, `/{siteRef}/{localeRef}/blog/preview`, and `/{siteRef}/{localeRef}/blog/{contentId}`.

## Customization

- Create additional Content Assets in the configured folder and complete the **SFNext Blog** group.
- Use readable, URL-safe Content Asset IDs; the ID forms the public article URL.
- Publish the asset and rebuild the content index when required.
- Use Page Designer to change the blog hero, Blog Post Grid filters and presentation, Content Collection layout and field visibility, and the components before or after every article without changing application code.

Content Collection can also display generic Content Assets: choose **All** or **Generic**, then map custom Content attribute IDs for title, summary, image, image alternative text, publication date, author, category, and link when the default fields do not match the content model. It supports a responsive grid or carousel and either exact manual IDs or the latest N online assets from a folder.

Page Designer has no native picker for B2C Content Assets. Its `cms_record` attribute targets Salesforce CMS instead. Manual Content Collection authoring therefore accepts exact Content Asset IDs, one per line or comma-separated, and preserves that order. Use the ID rather than the asset name or URL; use Latest mode when folder-based automatic discovery is preferable.

Folder-backed components depend on the content search index. After imports, bulk edits, folder assignments, locale changes, or publishing, rebuild the target site's index and allow for normal API/runtime cache propagation before troubleshooting the React component.

The metadata import is idempotent and can be repeated when the attribute definitions change.
