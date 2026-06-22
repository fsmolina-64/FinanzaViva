import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
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
  constructor(private financesService: FinancesService) { }

  @Get('summary')
  getSummary(@Request() req: any) { return this.financesService.getSummary(req.user.id); }

  @Get('budget-health')
  getBudgetHealth(@Request() req: any) { return this.financesService.getBudgetHealth(req.user.id); }

  @Post('accounts')
  createAccount(@Request() req: any, @Body() dto: CreateAccountDto) { return this.financesService.createAccount(req.user.id, dto); }

  @Get('accounts')
  getAccounts(@Request() req: any) { return this.financesService.getAccounts(req.user.id); }

  @Patch('accounts/:id')
  updateAccount(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateAccountDto) { return this.financesService.updateAccount(req.user.id, id, dto); }

  @Delete('accounts/:id')
  deleteAccount(@Request() req: any, @Param('id') id: string) { return this.financesService.deleteAccount(req.user.id, id); }

  @Post('transactions')
  createTransaction(@Request() req: any, @Body() dto: CreateTransactionDto) { return this.financesService.createTransaction(req.user.id, dto); }

  @Get('transactions')
  getTransactions(@Request() req: any) { return this.financesService.getTransactions(req.user.id); }

  @Patch('transactions/:id')
  updateTransaction(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTransactionDto) { return this.financesService.updateTransaction(req.user.id, id, dto); }

  @Delete('transactions/:id')
  deleteTransaction(@Request() req: any, @Param('id') id: string) { return this.financesService.deleteTransaction(req.user.id, id); }

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
  createTransfer(@Request() req: any, @Body() dto: CreateTransferDto) { return this.financesService.createTransfer(req.user.id, dto); }

  @Patch('transfers/:groupId')
  updateTransfer(@Request() req: any, @Param('groupId') groupId: string, @Body() dto: any) { return this.financesService.updateTransfer(req.user.id, groupId, dto); }

  @Delete('transfers/:groupId')
  deleteTransfer(@Request() req: any, @Param('groupId') groupId: string) { return this.financesService.deleteTransferByGroup(req.user.id, groupId); }
}