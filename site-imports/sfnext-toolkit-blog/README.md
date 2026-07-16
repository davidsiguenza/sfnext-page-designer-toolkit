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

1. Generate and deploy `plugin_sfnext_page_designer`, including the `sfnextToolkitBlogHomePage` and `sfnextToolkitBlogPostPage` page types and `SFNextToolkit.blogPostGrid` component.
2. Zip this directory with `meta/` at the archive root and import it through **Administration > Site Development > Site Import & Export**, or use B2C CLI.
3. In the target site's content library, create a folder whose ID is `sfnext-blog` (or configure another folder ID on Blog Post Grid).
4. Create online Content Assets in that folder and complete the standard fields plus the **SFNext Blog** fields. Keep each Content Asset ID URL-safe because it becomes the post slug.
5. In Page Designer, create a blog-home page with ID `blog` and type `SFNext Toolkit Blog Home`; add Blog Post Grid to its `posts` region.
6. Create the shared post-layout page with ID `blog-post-layout` and type `SFNext Toolkit Blog Post`.
7. Grant the Storefront Next SLAS client the `sfcc.shopper-experience.contents` scope and rebuild the target site's content search index.

The storefront routes are `/{siteRef}/{localeRef}/blog`, `/{siteRef}/{localeRef}/blog/preview`, and `/{siteRef}/{localeRef}/blog/{contentId}`.

## Customization

- Create additional Content Assets in the configured folder and complete the **SFNext Blog** group.
- Use readable, URL-safe Content Asset IDs; the ID forms the public article URL.
- Publish the asset and rebuild the content index when required.
- Use Page Designer to change the blog hero, Blog Post Grid filters and presentation, and the components before or after every article without changing application code.

The metadata import is idempotent and can be repeated when the attribute definitions change.
