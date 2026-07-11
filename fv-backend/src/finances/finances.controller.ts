import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request, BadRequestException, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { FinancesService } from './finances.service';
import { AccountsService } from './accounts.service';
import { TransactionsService } from './transactions.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PdfReportDataService } from './pdf/pdf-report-data.service';
import { PdfReportService } from './pdf/pdf-report.service';
import { ExportPdfDto } from './dto/export-pdf.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@UseGuards(JwtGuard)
@Controller('finances')
export class FinancesController {
  constructor(
    private financesService: FinancesService,
    private accountsService: AccountsService,
    private transactionsService: TransactionsService,
    private pdfReportDataService: PdfReportDataService,
    private pdfReportService: PdfReportService,
  ) {}

  @Get('summary')
  getSummary(@Request() req: any) { return this.financesService.getSummary(req.user.id); }

  @Get('budget-health')
  getBudgetHealth(@Request() req: any) { return this.financesService.getBudgetHealth(req.user.id); }

  @Post('accounts')
  createAccount(@Request() req: any, @Body() dto: CreateAccountDto) { return this.accountsService.createAccount(req.user.id, dto); }

  @Get('accounts')
  getAccounts(@Request() req: any) { return this.accountsService.getAccounts(req.user.id); }

  @Patch('accounts/:id')
  updateAccount(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateAccountDto) { return this.accountsService.updateAccount(req.user.id, id, dto); }

  @Delete('accounts/:id')
  deleteAccount(@Request() req: any, @Param('id') id: string) { return this.accountsService.deleteAccount(req.user.id, id); }

  @Post('transactions')
  createTransaction(@Request() req: any, @Body() dto: CreateTransactionDto) { return this.transactionsService.createTransaction(req.user.id, dto); }

  @Get('transactions')
  getTransactions(@Request() req: any) { return this.transactionsService.getTransactions(req.user.id); }

  @Patch('transactions/:id')
  updateTransaction(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTransactionDto) { return this.transactionsService.updateTransaction(req.user.id, id, dto); }

  @Delete('transactions/:id')
  deleteTransaction(@Request() req: any, @Param('id') id: string) { return this.transactionsService.deleteTransaction(req.user.id, id); }

  @Get('categories')
  getCategories(@Request() req: any) { return this.financesService.getCategories(req.user.id); }

  @Post('categories')
  createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) { return this.financesService.createCategory(req.user.id, dto); }

  @Patch('categories/:id')
  updateCategory(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.financesService.updateCategory(req.user.id, id, dto); }

  @Delete('categories/:id')
  deleteCategory(@Request() req: any, @Param('id') id: string, @Query('reassignToId') reassignToId?: string) { return this.financesService.deleteCategory(req.user.id, id, reassignToId); }

  @Post('budgets')
  createBudget(@Request() req: any, @Body() dto: CreateBudgetDto) { return this.financesService.createBudget(req.user.id, dto); }

  @Get('budgets')
  getBudgets(@Request() req: any) { return this.financesService.getBudgets(req.user.id); }

  @Patch('budgets/:id')
  updateBudget(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateBudgetDto) { return this.financesService.updateBudget(req.user.id, id, dto); }

  @Delete('budgets/:id')
  deleteBudget(@Request() req: any, @Param('id') id: string) { return this.financesService.deleteBudget(req.user.id, id); }

  @Post('goals')
  createGoal(@Request() req: any, @Body() dto: CreateGoalDto) { return this.financesService.createGoal(req.user.id, dto); }

  @Get('goals')
  getGoals(@Request() req: any) { return this.financesService.getGoals(req.user.id); }

  @Patch('goals/:id')
  updateGoal(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateGoalDto) { return this.financesService.updateGoal(req.user.id, id, dto); }

  @Delete('goals/:id')
  deleteGoal(@Request() req: any, @Param('id') id: string) { return this.financesService.deleteGoal(req.user.id, id); }

  @Post('transfers')
  createTransfer(@Request() req: any, @Body() dto: CreateTransferDto) { return this.transactionsService.createTransfer(req.user.id, dto); }

  @Patch('transfers/:groupId')
  updateTransfer(@Request() req: any, @Param('groupId') groupId: string, @Body() dto: any) { return this.transactionsService.updateTransfer(req.user.id, groupId, dto); }

  @Delete('transfers/:groupId')
  deleteTransfer(@Request() req: any, @Param('groupId') groupId: string) { return this.transactionsService.deleteTransferByGroup(req.user.id, groupId); }

  @Post('export-pdf')
  async exportPdf(@Request() req: any, @Body() dto: ExportPdfDto, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    if (dto.from > dto.to) {
      throw new BadRequestException('"from" no puede ser posterior a "to"');
    }

    const data = await this.pdfReportDataService.buildReportData(req.user.id);
    const buffer = await this.pdfReportService.generateReportBuffer(data, { from: dto.from, to: dto.to });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="FinanzaViva_${dto.from}_${dto.to}.pdf"`,
    });
    return new StreamableFile(buffer);
  }
}
