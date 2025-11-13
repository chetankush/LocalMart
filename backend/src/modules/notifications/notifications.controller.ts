import {
  Controller,
  Get,
  Query,
  UseGuards,
  Post,
  Param,
  Delete,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { AuthGuard } from "../../shared/guards/auth.guard";
import { CurrentUser } from "../../shared/decorators/user.decorator";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAll(
    @CurrentUser() user: any,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("unreadOnly") unreadOnly?: string
  ) {
    const result = await this.notificationsService.findAll(user.id, {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      unreadOnly: unreadOnly === "true",
    });
    return {
      success: true,
      data: result,
    };
  }

  @Post(":id/mark-read")
  @UseGuards(AuthGuard)
  async markAsRead(@Param("id") id: string, @CurrentUser() user: any) {
    await this.notificationsService.markAsRead(id, user.id);
    return { success: true, message: "Notification marked as read" };
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  async delete(@Param("id") id: string, @CurrentUser() user: any) {
    await this.notificationsService.delete(id, user.id);
    return { success: true, message: "Notification deleted" };
  }
}
