-- Convert Enigma.answerMessage from TEXT to JSONB (document TipTap).

ALTER TABLE "Enigma" ADD COLUMN "answerMessage_new" JSONB;

UPDATE "Enigma" SET "answerMessage_new" = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content',
      CASE
        WHEN COALESCE(TRIM("answerMessage"), '') = '' THEN '[]'::jsonb
        ELSE jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', "answerMessage"::text)
        )
      END
    )
  )
);

ALTER TABLE "Enigma" DROP COLUMN "answerMessage";
ALTER TABLE "Enigma" RENAME COLUMN "answerMessage_new" TO "answerMessage";
ALTER TABLE "Enigma" ALTER COLUMN "answerMessage" SET NOT NULL;
