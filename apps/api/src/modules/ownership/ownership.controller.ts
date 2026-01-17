import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OwnershipService } from './ownership.service';
import { InitiateTransferDto, ConfirmTransferDto, TransferResponseDto } from './dto';
import type { AuthenticatedUser } from '@trafi/types';

/**
 * Ownership Transfer Controller
 *
 * Handles store ownership transfer requests.
 * Transfers require password re-confirmation and have a 72-hour expiration.
 *
 * Security:
 * - Initiate requires 'ownership:transfer' permission (Owner only)
 * - Confirm requires being the target user (no special permission)
 * - Cancel can be done by either initiator or target
 *
 * @see epic-02-admin-auth.md#Story-2.8
 */
@ApiTags('ownership')
@Controller('ownership')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class OwnershipController {
  constructor(private readonly ownershipService: OwnershipService) {}

  /**
   * Initiate an ownership transfer
   */
  @Post('transfer')
  @RequirePermissions('ownership:transfer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initiate ownership transfer',
    description:
      'Start the ownership transfer process to another team member. Requires password confirmation. Only the current Owner can initiate.',
  })
  @ApiBody({ type: InitiateTransferDto })
  @ApiResponse({
    status: 201,
    description: 'Transfer initiated successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or pending transfer exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Invalid password or insufficient permissions' })
  async initiate(
    @Body() input: InitiateTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    return this.ownershipService.initiate(user.storeId, user.id, input);
  }

  /**
   * Confirm an ownership transfer
   */
  @Post('transfer/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm ownership transfer',
    description:
      'Accept the ownership transfer. Only the target user can confirm. Requires password confirmation.',
  })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @ApiBody({ type: ConfirmTransferDto })
  @ApiResponse({
    status: 200,
    description: 'Transfer confirmed - ownership has been transferred',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Transfer not found or expired' })
  @ApiResponse({ status: 403, description: 'Invalid password' })
  async confirm(
    @Param('id') id: string,
    @Body() input: ConfirmTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    return this.ownershipService.confirm(user.storeId, user.id, {
      transferId: id,
      password: input.password,
    });
  }

  /**
   * Cancel an ownership transfer
   */
  @Post('transfer/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel ownership transfer',
    description:
      'Cancel a pending transfer. Both the initiator and target can cancel.',
  })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer cancelled',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Transfer not found or already processed' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    return this.ownershipService.cancel(user.storeId, user.id, id);
  }

  /**
   * Get pending transfer for current user
   */
  @Get('transfer/pending')
  @ApiOperation({
    summary: 'Get pending transfer',
    description:
      'Get any pending ownership transfer involving the current user (either as initiator or target).',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending transfer or null',
    type: TransferResponseDto,
  })
  async getPending(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferResponseDto | null> {
    return this.ownershipService.getPending(user.storeId, user.id);
  }

  /**
   * Get transfer history for the store
   */
  @Get('transfer/history')
  @RequirePermissions('ownership:transfer')
  @ApiOperation({
    summary: 'Get transfer history',
    description:
      'Get the history of ownership transfers for this store. Only the Owner can view.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transfer history list',
    type: [TransferResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransferResponseDto[]> {
    return this.ownershipService.getHistory(user.storeId);
  }
}
