import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AiService } from './ai.service.js';
import { GenerateContentDto } from './dto/generate-content.dto.js';
import { SaveGeneratedDto } from './dto/save-generated.dto.js';
import { ChatDto } from './dto/chat.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { PaymentService } from '../payment/payment.service.js';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly paymentService: PaymentService,
  ) {}

  // ─────────────────────────────────────────────────────
  // POST /ai/extract-text
  // Extrait le texte d'un fichier PDF ou Word uploadé
  // Utilisé par le frontend pour pré-remplir "Cours existant"
  // ─────────────────────────────────────────────────────
  @Post('extract-text')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async extractText(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    return this.aiService.extractTextFromFile(file);
  }

  // ─────────────────────────────────────────────────────
  // POST /ai/chat
  // Conversation libre avec l'IA — consomme 1 crédit
  // ─────────────────────────────────────────────────────
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() dto: ChatDto,
    @CurrentUser() user: { sub: number; id: number },
  ) {
    // Vérifier et consommer 1 crédit (lève 400 si insuffisant)
    this.paymentService.consumeCredit(user.sub ?? user.id);
    return this.aiService.chat(dto);
  }

  // ─────────────────────────────────────────────────────
  // POST /ai/generate-from-archive/:archiveId (BF-19)
  // Génère du contenu depuis le texte d'une archive — consomme 1 crédit
  // ─────────────────────────────────────────────────────
  @Post('generate-from-archive/:archiveId')
  @HttpCode(HttpStatus.OK)
  async generateFromArchive(
    @Param('archiveId') archiveId: string,
    @Body() dto: GenerateContentDto,
    @CurrentUser() user: { sub: number; id: number },
  ) {
    this.paymentService.consumeCredit(user.sub ?? user.id);
    return this.aiService.generateFromArchive(+archiveId, dto);
  }

  // ─────────────────────────────────────────────────────
  // POST /ai/generate
  // L'enseignant envoie : matière, type, thème, cours (optionnel)
  // L'IA retourne le contenu généré — consomme 1 crédit
  // ─────────────────────────────────────────────────────
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(
    @Body() dto: GenerateContentDto,
    @CurrentUser() user: { sub: number; id: number },
  ) {
    this.paymentService.consumeCredit(user.sub ?? user.id);
    return this.aiService.generate(dto);
  }

  // ─────────────────────────────────────────────────────
  // POST /ai/save
  // Sauvegarde le contenu généré :
  //  - cours/resume  → ContentService (visible dans "Mes Contenus")
  //  - quiz/serie/examen → QuizService (visible dans "Mes Quiz")
  // ─────────────────────────────────────────────────────
  @Post('save')
  @HttpCode(HttpStatus.CREATED)
  save(
    @Body() dto: SaveGeneratedDto,
    @CurrentUser() user: { sub: number; id: number },
  ) {
    return this.aiService.save(dto, user?.sub ?? user?.id);
  }

  // ─────────────────────────────────────────────────────
  // GET /ai/contents
  // Lister tous les contenus générés
  // ─────────────────────────────────────────────────────
  @Get('contents')
  findAll() {
    return this.aiService.findAll();
  }

  // ─────────────────────────────────────────────────────
  // GET /ai/contents/:id
  // Voir un contenu généré
  // ─────────────────────────────────────────────────────
  @Get('contents/:id')
  findOne(@Param('id') id: string) {
    return this.aiService.findOne(+id);
  }

  // ─────────────────────────────────────────────────────
  // PATCH /ai/contents/:id/valider
  // Valider un contenu (brouillon → validé)
  // ─────────────────────────────────────────────────────
  @Patch('contents/:id/valider')
  valider(@Param('id') id: string) {
    return this.aiService.valider(+id);
  }

  // ─────────────────────────────────────────────────────
  // PATCH /ai/contents/:id/modifier
  // Modifier manuellement le contenu généré
  // ─────────────────────────────────────────────────────
  @Patch('contents/:id/modifier')
  modifier(
    @Param('id') id: string,
    @Body() body: { contenu: string },
  ) {
    return this.aiService.updateContenu(+id, body.contenu);
  }
}
