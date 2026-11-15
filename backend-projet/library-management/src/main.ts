import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { AuthService } from './auth/auth.service.js';
import { Persist } from './db/persist.js';

async function bootstrap() {
  const app: any = await NestFactory.create(AppModule);

  // En prod (Docker/nginx), le frontend est servi sur la même origine que l'API.
  // On autorise les origines localhost pour le dev, et l'origine de FRONTEND_URL pour la prod.
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Pas d'origine (curl, Postman, Railway interne) → autorisé
      if (!origin) return callback(null, true);

      const allowed =
        // Dev local
        origin.startsWith('http://localhost') ||
        // Vercel (tous les sous-domaines : preview + production)
        origin.endsWith('.vercel.app') ||
        // URL custom définie dans FRONTEND_URL
        (!!process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);

      if (allowed) return callback(null, true);
      callback(new Error(`CORS bloqué : ${origin}`));
    },
    credentials: true,
  });

  // ── Préfixe global /api ────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation globale des DTOs ─────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,      // supprime les champs non déclarés dans le DTO
      forbidNonWhitelisted: false, // on accepte les champs supplémentaires (compatibilité frontend)
      transform: true,      // convertit les types automatiquement (string → number)
    }),
  );

  // ── Guards globaux ──────────────────────────────────
  // Toutes les routes sont protégées par JWT sauf celles marquées @Public()
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
  );

  // ── Swagger ─────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('ExoCraft API')
    .setDescription('API du backend ExoCraft')
    .setVersion('1.0')
    .addBearerAuth()   // bouton Authorize dans Swagger
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  // ── Charger les données persistées D'ABORD ─────────────
  await Persist.loadAll(); // CHANGÉ : ajout de await

  // ── Seed admin par défaut ────────────────────────────
  // Crée le compte admin APRÈS le chargement des données persistées
  const authService = app.get(AuthService);
  try {
    await authService.register({
      nom: 'Admin',
      prenom: 'Système',
      email: 'admin@tekup.tn',
      motDePasse: 'admin@1234',
      role: 'administrateur',
    } as any);
    console.log('✅ Compte admin créé : admin@tekup.tn / admin@1234');
    await Persist.saveAll(); // CHANGÉ : ajout de await
  } catch {
    console.log('ℹ️  Compte admin déjà existant.');
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();