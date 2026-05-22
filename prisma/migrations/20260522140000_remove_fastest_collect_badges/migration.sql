-- Retrait des badges « le plus rapide » et « observateur » (données + définitions).

DELETE FROM "UserBadge"
WHERE "badgeDefinitionId" IN (
  SELECT "id" FROM "BadgeDefinition"
  WHERE "kind" IN ('PERFORMANCE_FASTEST', 'PERFORMANCE_COLLECT')
);

DELETE FROM "BadgeDefinition"
WHERE "kind" IN ('PERFORMANCE_FASTEST', 'PERFORMANCE_COLLECT');
