import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateGoalDto } from './dto/create-goal.dto';

@UseGuards(JwtGuard)
@Controller('finances')
export class FinancesController {
  constructor(private financesService: FinancesService) {}

  @Get('summary')
  getSummary(@Request() req: any) {
    return this.financesService.getSummary(req.user.id);
  }

  @Post('accounts')
  createAccount(@Request() req: any, @Body() dto: CreateAccountDto) {
    return this.financesService.createAccount(req.user.id, dto);
  }

  @Get('accounts')
  getAccounts(@Request() req: any) {
    return this.financesService.getAccounts(req.user.id);
  }

  @Delete('accounts/:id')
  deleteAccount(@Request() req: any, @Param('id') id: string) {
    return this.financesService.deleteAccount(req.user.id, id);
  }

  @Post('transactions')
  createTransaction(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.financesService.createTransaction(req.user.id, dto);
  }

  @Get('transactions')
  getTransactions(@Request() req: any) {
    return this.financesService.getTransactions(req.user.id);
  }

  @Get('categories')
  getCategories(@Request() req: any) {
    return this.financesService.getCategories(req.user.id);
  }

  @Post('budgets')
  createBudget(@Request() req: any, @Body() dto: CreateBudgetDto) {
    return this.financesService.createBudget(req.user.id, dto);
  }

  @Get('budgets')
  getBudgets(@Request() req: any) {
    return this.financesService.getBudgets(req.user.id);
  }

  @Post('goals')
  createGoal(@Request() req: any, @Body() dto: CreateGoalDto) {
    return this.financesService.createGoal(req.user.id, dto);
  }

  @Get('goals')
  getGoals(@Request() req: any) {
    return this.financesService.getGoals(req.user.id);
  }
}