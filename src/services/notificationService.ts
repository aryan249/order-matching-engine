export class NotificationService {
    async notify(event: string, data: any): Promise<void> {
        console.log(`[Notification] ${event}`, data);
    }
}
