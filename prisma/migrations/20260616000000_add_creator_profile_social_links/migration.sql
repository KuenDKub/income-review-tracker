ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "social_links" TEXT NOT NULL DEFAULT '';
ALTER TABLE "creator_profile" ADD COLUMN IF NOT EXISTS "rate_card_bg_url" TEXT;

INSERT INTO "creator_profile" ("social_links")
SELECT $$[{"imageUrl":"/social/tiktok.svg","label":"TikTok","url":"https://www.tiktok.com/@francfoil"},{"imageUrl":"/social/instagram.svg","label":"Instagram","url":"https://www.instagram.com/francfoil"},{"imageUrl":"/social/facebook.svg","label":"Facebook","url":"https://www.facebook.com/FOIL.SRY"},{"imageUrl":"/social/youtube.svg","label":"YouTube","url":"https://www.youtube.com/channel/UC4I9BORllZqEgALQZuc-33A"},{"imageUrl":"/social/lemon8.svg","label":"Lemon8","url":"https://www.lemon8-app.com/@francfoil?mid=7098954312219624453&_r=1&_t=&region=th&share_platform=copy"}]$$
WHERE NOT EXISTS (SELECT 1 FROM "creator_profile");

UPDATE "creator_profile"
SET
  "social_links" = $$[{"imageUrl":"/social/tiktok.svg","label":"TikTok","url":"https://www.tiktok.com/@francfoil"},{"imageUrl":"/social/instagram.svg","label":"Instagram","url":"https://www.instagram.com/francfoil"},{"imageUrl":"/social/facebook.svg","label":"Facebook","url":"https://www.facebook.com/FOIL.SRY"},{"imageUrl":"/social/youtube.svg","label":"YouTube","url":"https://www.youtube.com/channel/UC4I9BORllZqEgALQZuc-33A"},{"imageUrl":"/social/lemon8.svg","label":"Lemon8","url":"https://www.lemon8-app.com/@francfoil?mid=7098954312219624453&_r=1&_t=&region=th&share_platform=copy"}]$$,
  "updated_at" = now()
WHERE NULLIF(trim("social_links"), '') IS NULL;

UPDATE "creator_profile"
SET
  "social_links" = $$[{"imageUrl":"/social/tiktok.svg","label":"TikTok","url":"https://www.tiktok.com/@francfoil"},{"imageUrl":"/social/instagram.svg","label":"Instagram","url":"https://www.instagram.com/francfoil"},{"imageUrl":"/social/facebook.svg","label":"Facebook","url":"https://www.facebook.com/FOIL.SRY"},{"imageUrl":"/social/youtube.svg","label":"YouTube","url":"https://www.youtube.com/channel/UC4I9BORllZqEgALQZuc-33A"},{"imageUrl":"/social/lemon8.svg","label":"Lemon8","url":"https://www.lemon8-app.com/@francfoil?mid=7098954312219624453&_r=1&_t=&region=th&share_platform=copy"}]$$,
  "updated_at" = now()
WHERE "social_links" LIKE '%"icon"%'
  AND "social_links" LIKE '%francfoil%';
