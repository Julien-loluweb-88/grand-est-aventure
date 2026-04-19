-- URL optionnelle du fichier 3D hébergé (admin) ; sinon l’app mobile utilise le bundle (`slug`).

ALTER TABLE "avatar" ADD COLUMN "modelUrl" TEXT;
