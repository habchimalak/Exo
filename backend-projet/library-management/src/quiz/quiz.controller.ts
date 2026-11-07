import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { QuizService } from './quiz.service.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { UpdateQuizDto } from './dto/update-quiz.dto.js';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import { ImportQuizDto } from './dto/import-quiz.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ─────────────────────────────────────────────────────
  // CRUD QUIZ
  // ─────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createQuizDto: CreateQuizDto,
    @CurrentUser() user: { sub: number; id: number },
  ) {
    return this.quizService.create({ ...createQuizDto, auteurId: user.sub ?? user.id });
  }

  // GET /quiz — retourne uniquement les quiz de l'utilisateur connecté
  @Get()
  findAll(
    @CurrentUser() user: { sub: number; id: number },
    @Query('matiere') matiere?: string,
    @Query('statut') statut?: 'brouillon' | 'valide',
    @Query('niveau') niveau?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.quizService.findAllPaginated({
      auteurId: user.sub ?? user.id,
      matiere,
      statut,
      niveau,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quizService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizService.update(+id, updateQuizDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quizService.remove(+id);
  }

  // ─────────────────────────────────────────────────────
  // VALIDER ET PUBLIER
  // ─────────────────────────────────────────────────────

  @Patch(':id/valider')
  valider(@Param('id') id: string) {
    return this.quizService.valider(+id);
  }

  @Patch(':id/visibilite')
  toggleVisibilite(@Param('id') id: string) {
    return this.quizService.toggleVisibilite(+id);
  }

  // ─────────────────────────────────────────────────────
  // ARCHIVAGE
  // ─────────────────────────────────────────────────────

  // GET /quiz/archived — liste des quiz archivés
  @Get('archived/list')
  findArchived(
    @Query('matiere') matiere?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.quizService.findArchived({
      matiere,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  // PATCH /quiz/:id/archiver — archiver un quiz
  @Patch(':id/archiver')
  archiver(@Param('id') id: string) {
    return this.quizService.archiver(+id);
  }

  // PATCH /quiz/:id/desarchiver — désarchiver
  @Patch(':id/desarchiver')
  desarchiver(@Param('id') id: string) {
    return this.quizService.desarchiver(+id);
  }

  // ─────────────────────────────────────────────────────
  // GESTION DES QUESTIONS
  // ─────────────────────────────────────────────────────

  // Ajouter une question à un quiz
  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  addQuestion(
    @Param('id') id: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.quizService.addQuestion(+id, createQuestionDto);
  }

  // Modifier une question existante
  @Patch(':id/questions/:questionId')
  updateQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.quizService.updateQuestion(+id, +questionId, updateQuestionDto);
  }

  // Supprimer une question
  @Delete(':id/questions/:questionId')
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    return this.quizService.removeQuestion(+id, +questionId);
  }

  // ─────────────────────────────────────────────────────
  // IMPORT DEPUIS L'IA
  // ─────────────────────────────────────────────────────

  // Crée un quiz complet depuis le contenu généré par l'IA
  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  importFromAi(@Body() importQuizDto: ImportQuizDto) {
    return this.quizService.importFromAi(importQuizDto);
  }

  // POST /quiz/:id/variante — créer une variante (BF-08)
  @Post(':id/variante')
  @HttpCode(HttpStatus.CREATED)
  creerVariante(@Param('id') id: string) {
    return this.quizService.creerVariante(+id);
  }

  // ─────────────────────────────────────────────────────
  // PARTAGE PUBLIC
  // ─────────────────────────────────────────────────────

  // POST /quiz/:id/partager — génère le lien de partage
  @Post(':id/partager')
  @HttpCode(HttpStatus.OK)
  partager(@Param('id') id: string) {
    return this.quizService.partager(+id);
  }

  // GET /quiz/:id/resultats — résultats des étudiants (prof)
  @Get(':id/resultats')
  getResultats(@Param('id') id: string) {
    return this.quizService.getResultats(+id);
  }

  // GET /quiz/public/:token — quiz sans réponses (étudiant, sans auth)
  @Public()
  @Get('public/:token')
  findPublic(@Param('token') token: string) {
    return this.quizService.findPublic(token);
  }

  // POST /quiz/public/:token/soumettre — soumettre les réponses (sans auth)
  @Public()
  @Post('public/:token/soumettre')
  @HttpCode(HttpStatus.OK)
  soumettre(
    @Param('token') token: string,
    @Body() body: {
      nom: string;
      prenom: string;
      reponses: { questionId: number; choix: string }[];
    },
  ) {
    return this.quizService.soumettre(token, body);
  }
}
