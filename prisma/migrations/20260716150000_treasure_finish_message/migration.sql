-- Message de fin (TipTap JSON) après validation du code coffre.

ALTER TABLE "Treasure" ADD COLUMN "finishMessage" JSONB;

UPDATE "Treasure" SET "finishMessage" = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'text',
          'text', 'Bravo ! Vous avez trouvé le trésor.'
        )
      )
    )
  )
)
WHERE "finishMessage" IS NULL;

ALTER TABLE "Treasure" ALTER COLUMN "finishMessage" SET NOT NULL;
