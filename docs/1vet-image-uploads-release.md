# Image uploads — 11 November 2026

Article covers and admin shop galleries now use a shared file uploader instead of image URL entry. The platform audit found these were the two remaining image URL inputs; profile and pet photos already use file uploads. Existing saved image addresses remain compatible so published images are preserved.

## Behavior

- Choose files or drag and drop JPG, PNG or WebP images up to 10 MB each. Article covers support replacement/removal; shop galleries support five images, with the first used as the main product image.
- Browser decoding rejects unreadable files, re-encodes to strip metadata, and scales images to a maximum 1920-pixel edge. Processed uploads are capped at 5 MB; SVG is not accepted. Processing uses WebP, with browser PNG fallback supported.
- Upload progress, previews and explicit errors appear in the editor. Saves are blocked while uploading. Failures preserve existing images and successful files from a partly completed batch. Replacing a cover retains the current image until its replacement succeeds.
- Removing an image changes the form reference; saving the article/product makes that change persistent. Object names are unique and uploads never overwrite existing images. Stored objects are retained for published references and recovered browser drafts; trusted maintenance may later remove confirmed orphan files.

## Storage and deployment

`20261111020000_platform_image_uploads.sql` creates the public `platform-images` bucket with a 5 MB limit and JPEG/PNG/WebP allowlist. Uploads require an active administrator, their own user folder, and an article/shop path. Restrictive policies prevent broad existing policies from permitting unauthorized uploads, overwrite or deletion. Private veterinary evidence buckets are unchanged.

The migration was applied and tracked on main `onevet-production`; all earlier tracked migrations were skipped. Deploy the new main frontend commit to expose the controls. No environment configuration was published. Payments remain disabled.

## Validation

325 frontend tests passed across 86 files. Typecheck and production build passed; lint reported zero errors and nine existing warnings. The isolated database suite passed 422 SQL assertions plus five concurrency checks. Ten storage checks also passed in rollback-only main transactions, including admin access, anonymous reading, suspended-user denial and immutable-object protection.

Chromium exercised actual file selection, browser image processing, shop image persistence in the save payload, cover replacement and removal at 1440, 390 and 320 pixels without overflow or runtime exceptions. Network responses were intercepted fixtures, so these tests did not upload actual test files to production storage or publish articles/products. Production hostname deployment was not browser-verified. Session screenshots are under `/workspace/artifacts/1vet/image-uploads`.
