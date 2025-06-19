import { db } from "../db";
import { notifications, NotificationType, users, UserType, WithdrawalStatus, WithdrawalStatusValues } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Cria uma notificação para um usuário
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data = null
}: {
  userId: number;
  type: NotificationType[keyof NotificationType];
  title: string;
  message: string;
  data?: any;
}) {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        user_id: userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        read: false,
        created_at: new Date()
      })
      .returning();
    
    return notification;
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    return null;
  }
}

/**
 * Cria uma notificação de transação para o cliente
 */
export async function createTransactionNotification(
  userId: number,
  storeId: number,
  storeName: string,
  amount: number,
  cashbackAmount: number,
  transactionId: number
) {
  const title = "Nova compra realizada";
  const message = `Você realizou uma compra de $${amount.toFixed(2)} em ${storeName} e recebeu $${cashbackAmount.toFixed(2)} em cashback.`;
  
  return createNotification({
    userId,
    type: NotificationType.TRANSACTION,
    title,
    message,
    data: {
      transactionId,
      storeId,
      storeName,
      amount,
      cashbackAmount
    }
  });
}

/**
 * Cria uma notificação de transação para o lojista
 */
export async function createMerchantTransactionNotification(
  merchantUserId: number,
  clientName: string,
  amount: number,
  transactionId: number
) {
  const title = "Nova venda registrada";
  const message = `${clientName} realizou uma compra de $${amount.toFixed(2)} em sua loja.`;
  
  return createNotification({
    userId: merchantUserId,
    type: NotificationType.TRANSACTION,
    title,
    message,
    data: {
      transactionId,
      clientName,
      amount
    }
  });
}

/**
 * Cria uma notificação de transferência para o remetente
 */
export async function createTransferSentNotification(
  fromUserId: number,
  toUserName: string,
  amount: number,
  transferId: number
) {
  const title = "Transferência enviada";
  const message = `Você transferiu $${amount.toFixed(2)} para ${toUserName}.`;
  
  return createNotification({
    userId: fromUserId,
    type: NotificationType.TRANSFER,
    title,
    message,
    data: {
      transferId,
      toUserName,
      amount
    }
  });
}

/**
 * Cria uma notificação de transferência para o destinatário
 */
export async function createTransferReceivedNotification(
  toUserId: number,
  fromUserName: string,
  amount: number,
  transferId: number
) {
  const title = "Transferência recebida";
  const message = `Você recebeu $${amount.toFixed(2)} de ${fromUserName}.`;
  
  return createNotification({
    userId: toUserId,
    type: NotificationType.TRANSFER,
    title,
    message,
    data: {
      transferId,
      fromUserName,
      amount
    }
  });
}

/**
 * Cria uma notificação de bônus de indicação
 */
export async function createReferralBonusNotification(
  userId: number,
  referredName: string,
  bonusAmount: number
) {
  const title = "Bônus de indicação";
  const message = `Você recebeu $${bonusAmount.toFixed(2)} de bônus por indicar ${referredName}.`;
  
  return createNotification({
    userId,
    type: NotificationType.REFERRAL,
    title,
    message,
    data: {
      referredName,
      bonusAmount
    }
  });
}

/**
 * Cria uma notificação de sistema para um usuário
 */
export async function createSystemNotification(
  userId: number,
  title: string,
  message: string,
  data: any = null
) {
  return createNotification({
    userId,
    type: NotificationType.SYSTEM,
    title,
    message,
    data
  });
}

/**
 * Cria notificações de sistema para todos os usuários de um determinado tipo
 */
export async function createSystemNotificationForUserType(
  userType: string,
  title: string,
  message: string,
  data: any = null
) {
  try {
    // Buscar todos os usuários do tipo especificado
    const userIds = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.type, userType));
    
    // Criar uma notificação para cada usuário
    const results = await Promise.all(
      userIds.map(user => createSystemNotification(user.id, title, message, data))
    );
    
    return results.filter(Boolean);
  } catch (error) {
    console.error("Erro ao criar notificações para usuários:", error);
    return [];
  }
}

/**
 * Cria uma notificação para solicitação de saque
 */
export async function createWithdrawalRequestNotification(
  userId: number,
  withdrawalId: number,
  status: WithdrawalStatusValues,
  amount: string
) {
  try {
    let title = '';
    let message = '';
    
    switch (status) {
      case WithdrawalStatus.PENDING:
        title = "Solicitação de Saque Enviada";
        message = `Sua solicitação de saque no valor de $${amount} foi recebida e está em processamento.`;
        break;
      case WithdrawalStatus.COMPLETED:
        title = "Solicitação de Saque Aprovada";
        message = `Sua solicitação de saque no valor de $${amount} foi aprovada e processada.`;
        break;
      case WithdrawalStatus.REJECTED:
        title = "Solicitação de Saque Recusada";
        message = `Sua solicitação de saque no valor de $${amount} foi recusada. Entre em contato com o suporte para mais informações.`;
        break;
      case WithdrawalStatus.CANCELLED:
        title = "Solicitação de Saque Cancelada";
        message = `Sua solicitação de saque no valor de $${amount} foi cancelada e o valor foi retornado para sua carteira.`;
        break;
    }
    
    await createNotification({
      userId,
      type: NotificationType.WITHDRAWAL,
      title,
      message,
      data: { withdrawalId, status, amount }
    });
    
  } catch (error) {
    console.error("Erro ao criar notificação de saque:", error);
  }
}

/**
 * Cria uma notificação para administradores sobre nova solicitação de saque
 */
export async function createAdminWithdrawalNotification(
  merchantId: number, 
  merchantName: string,
  withdrawalId: number,
  amount: string
) {
  try {
    const title = "Nova Solicitação de Saque";
    const message = `O lojista ${merchantName} solicitou um saque de $${amount}.`;
    
    await createSystemNotificationForUserType(
      UserType.ADMIN,
      title,
      message,
      { withdrawalId, merchantId, amount }
    );
    
  } catch (error) {
    console.error("Erro ao criar notificação para administradores:", error);
  }
}