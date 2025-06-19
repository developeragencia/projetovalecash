import { Request, Response } from "express";
import { Express } from "express";
import { db } from "./db";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { 
  users, 
  merchants,
  cashbacks, 
  transactions, 
  transactionItems,
  qrCodes,
  commissionSettings,
  InsertQRCode,
  Transaction,
  InsertTransaction,
  TransactionItem,
  InsertTransactionItem
} from "@shared/schema";
import { isUserType } from "./routes";
import { v4 as uuidv4 } from "uuid";

export function addPaymentRoutes(app: Express) {
  // Endpoint para gerar um QR code de pagamento
  app.post("/api/merchant/generate-payment", isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const { amount, description, payment_type } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valor inválido" });
      }
      
      // Verificar valor mínimo de 5 dólares
      if (parseFloat(amount) < 5) {
        return res.status(400).json({ error: "O valor mínimo para pagamentos é de $5" });
      }
      
      // Criar um ID único para o QR code
      const paymentId = uuidv4();
      
      // Criar objeto com os dados do pagamento
      const paymentData = {
        type: "payment_request",
        id: paymentId,
        merchant_id: req.user?.id,
        merchant_name: req.user?.name,
        amount,
        description: description || "Pagamento Vale Cashback",
        payment_type: payment_type || "wallet",
        timestamp: new Date().toISOString(),
      };
      
      // Salvar o QR code no banco de dados
      const qrCodeData: InsertQRCode = {
        code: paymentId,
        user_id: req.user!.id, // Garantir que o usuário existe
        data: JSON.stringify(paymentData),
        amount: amount.toString(), // Armazenar o valor do pagamento
        description: description || "Pagamento Vale Cashback",
        expires_at: new Date(Date.now() + 1000 * 60 * 15), // 15 minutos de validade
        status: "active",
        type: "payment"
      };
      
      const [savedQrCode] = await db.insert(qrCodes).values(qrCodeData).returning();
      
      // Simplificar a resposta e garantir que o amount seja um número
      const response = {
        id: savedQrCode.id,
        qr_code_id: savedQrCode.code,
        qrCode: JSON.stringify(paymentData),
        amount: Number(amount), // Garantir que é um número
        description: description || "Pagamento Vale Cashback",
        payment_type: payment_type || "wallet",
        status: "pending",
        created_at: new Date().toISOString()
      };
      
      console.log("Enviando resposta para o cliente:", response);
      return res.status(200).json(response);
    } catch (error: any) {
      console.error("Erro ao gerar QR code de pagamento:", error);
      return res.status(500).json({ error: "Erro ao gerar QR code de pagamento" });
    }
  });
  
  // Endpoint para verificar um QR code de pagamento
  app.get("/api/payment-qr/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ error: "Código QR não fornecido" });
      }
      
      // Buscar o QR code no banco de dados
      const [qrCode] = await db.select().from(qrCodes).where(
        and(
          eq(qrCodes.code, code),
          eq(qrCodes.status, "active")
        )
      );
      
      if (!qrCode) {
        return res.status(404).json({ error: "QR code não encontrado ou inválido" });
      }
      
      // Verificar se o QR code não expirou
      if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
        return res.status(400).json({ error: "QR code expirado" });
      }
      
      // Retornar os dados do QR code
      const paymentData = qrCode.data ? JSON.parse(qrCode.data) : null;
      
      if (!paymentData) {
        return res.status(400).json({ error: "Dados de pagamento inválidos" });
      }
      
      return res.status(200).json({
        ...paymentData,
        qr_code_id: qrCode.code, // Usando qrCode.code em vez de qrCode.id
      });
    } catch (error: any) {
      console.error("Erro ao verificar QR code de pagamento:", error);
      return res.status(500).json({ error: "Erro ao verificar QR code de pagamento" });
    }
  });
  
  // Endpoint para processar o pagamento via QR code
  app.post("/api/client/process-payment", async (req: Request, res: Response) => {
    // Verificar autenticação manualmente para debug
    if (!req.isAuthenticated() || !req.user || req.user.type !== "client") {
      console.error("Erro de autenticação:", {
        isAuth: req.isAuthenticated(),
        user: req.user?.id,
        type: req.user?.type,
        session: req.sessionID
      });
      return res.status(401).json({ error: "Usuário não autenticado ou não é cliente" });
    }
    
    console.log("⭐ INICIANDO PROCESSAMENTO DE PAGAMENTO QR CODE ⭐");
    try {
      // Extrair dados do corpo da requisição
      const { qr_code_id, payment_type } = req.body;
      
      console.log("Dados recebidos para pagamento:", {
        qr_code_id,
        payment_type,
        body: JSON.stringify(req.body)
      });
      
      if (!qr_code_id) {
        return res.status(400).json({ error: "Código QR não fornecido" });
      }
      
      // Usar o ID diretamente do parâmetro
      const qrCodeId = qr_code_id;
      console.log("Buscando QR code com ID:", qrCodeId);
      
      // Buscar o QR code no banco de dados
      const qrCodeQuery = await db
        .select()
        .from(qrCodes)
        .where(eq(qrCodes.code, qrCodeId));
      
      if (!qrCodeQuery || qrCodeQuery.length === 0) {
        console.log("QR Code não encontrado para o ID:", qrCodeId);
        return res.status(404).json({ error: "QR code não encontrado" });
      }
        
      console.log("QR Code encontrado:", JSON.stringify(qrCodeQuery, null, 2));
      
      console.log("Resultado da busca de QR code:", qrCodeQuery);
      
      const [qrCode] = qrCodeQuery;
      
      if (!qrCode) {
        return res.status(404).json({ error: "QR code não encontrado ou inválido" });
      }
      
      // Verificar se o QR code já foi usado
      if (qrCode.status === "used") {
        return res.status(400).json({ error: "Este QR code já foi utilizado" });
      }
      
      // Verificar se o QR code não expirou
      if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
        return res.status(400).json({ error: "QR code expirado" });
      }
      
      const paymentInfo = qrCode.data ? JSON.parse(qrCode.data) : null;
      
      if (!paymentInfo) {
        return res.status(400).json({ error: "Dados de pagamento inválidos" });
      }
      
      // Obter o valor do parâmetro amount ou dos dados armazenados no QR code
      // Garantimos que o valor vem do banco de dados, não do cliente
      const qrAmount = qrCode.amount || (paymentInfo.amount ? paymentInfo.amount.toString() : "0");
      const merchant_id = paymentInfo.merchant_id;
      
      // Converter explicitamente para número para garantir comparações precisas
      const amountValue = parseFloat(qrAmount);
      
      console.log("Valores de pagamento:", {
        valorArmazenadoNoQR: qrAmount,
        valorConvertido: amountValue,
        merchantId: merchant_id
      });
      
      // Usar o tipo de pagamento escolhido pelo cliente (wallet ou bonus)
      const selectedPaymentType = payment_type || 'wallet';
      
      console.log("Tipo de pagamento selecionado:", selectedPaymentType);
      
      // Buscar o cliente (usuário atual)
      const client = req.user;
      
      // Verificar o cliente
      if (!client) {
        console.error("Cliente não encontrado no objeto de requisição:", req.user);
        return res.status(401).json({ error: "Cliente não autenticado. Faça login novamente." });
      }
      
      if (client.type !== "client") {
        console.error("Usuário não é do tipo cliente:", client.type);
        return res.status(403).json({ error: "Apenas clientes podem processar pagamentos" });
      }
      
      console.log("Cliente autenticado:", {
        clientId: client.id,
        clientName: client.name,
        clientType: client.type
      });
      
      // Verificar se o cliente tem saldo/bônus suficiente
      // Para isso, precisamos buscar o saldo atual do banco de dados
      let userBalance = 0;
      let userBonus = 0;
      
      // Registrar o valor extraído do QR code para depuração
      console.log("Valor a ser pago (extraído do QR):", {
        valorOriginal: amountValue,
        tipoValor: typeof amountValue,
        paymentType: selectedPaymentType
      });
      
      // Buscar saldo de cashback do cliente diretamente do banco de dados
      // para garantir valores atualizados
      const clientCashbacks = await db.select().from(cashbacks).where(eq(cashbacks.user_id, client.id));
      
      // Obter saldo atualizado do cliente
      if (clientCashbacks.length > 0) {
        // Garantir conversão explícita para número
        const balanceStr = clientCashbacks[0].balance;
        
        // Converter explicitamente para número usando Number em vez de parseFloat
        // para garantir a consistência dos tipos
        userBalance = Number(balanceStr);
        
        // Como não temos campo 'bonus' na tabela, vamos calcular como 30% do saldo principal
        // Esta é uma regra de negócio que deve ser ajustada conforme as especificações do sistema
        userBonus = userBalance * 0.3;
        
        // Log para depuração dos valores originais
        console.log("Valores originais do banco de dados:", {
          balanceOriginal: balanceStr,
          bonusCalculado: userBonus,
          balanceConvertido: userBalance,
          bonusConvertido: userBonus
        });
      } else {
        console.log("Cliente não possui registro de cashback no banco de dados");
      }
      
      // Garantir que todos os valores são números válidos para evitar problemas
      userBalance = isNaN(userBalance) ? 0 : userBalance;
      userBonus = isNaN(userBonus) ? 0 : userBonus;
      const amountToPay = Number(qrAmount);
      
      // Usar Number em vez de parseFloat para garantir consistência
      const numericUserBalance = Number(userBalance);
      const numericUserBonus = Number(userBonus);
      const numericAmountToPay = Number(amountValue);
      
      // Arredondar para 2 casas decimais para evitar problemas de ponto flutuante
      const roundedUserBalance = Math.round(numericUserBalance * 100) / 100;
      const roundedUserBonus = Math.round(numericUserBonus * 100) / 100;
      const roundedAmountToPay = Math.round(numericAmountToPay * 100) / 100;
      
      console.log("Saldos do cliente (após conversão numérica):", { 
        originalUserBalance: userBalance,
        originalUserBonus: userBonus, 
        originalAmount: amountValue,
        roundedUserBalance: roundedUserBalance,
        roundedUserBonus: roundedUserBonus, 
        roundedAmountToPay: roundedAmountToPay,
        hasEnoughWalletBalance: roundedUserBalance >= roundedAmountToPay,
        hasEnoughBonusBalance: roundedUserBonus >= roundedAmountToPay
      });
      
      console.log("Comparação detalhada de valores:", {
        balanceTipoOriginal: typeof userBalance,
        bonusTipoOriginal: typeof userBonus,
        amountTipoOriginal: typeof amountValue,
        balanceConvertidoTipo: typeof roundedUserBalance,
        bonusConvertidoTipo: typeof roundedUserBonus,
        amountConvertidoTipo: typeof roundedAmountToPay,
        diferençaSaldo: roundedUserBalance - roundedAmountToPay,
        saldoSuficiente: roundedUserBalance >= roundedAmountToPay
      });
      
      // Fazer uma única verificação robusta de saldo usando valores arredondados para precisão
      if (selectedPaymentType === "wallet") {
        // Verificação de saldo da carteira
        if (roundedUserBalance < roundedAmountToPay) {
          console.log("❌ PAGAMENTO REJEITADO: Saldo insuficiente na carteira", {
            saldoDisponível: roundedUserBalance,
            valorPagamento: roundedAmountToPay,
            diferença: roundedUserBalance - roundedAmountToPay,
            tipoSaldo: typeof roundedUserBalance,
            tipoPagamento: typeof roundedAmountToPay
          });
          
          return res.status(400).json({ 
            error: "Saldo insuficiente na carteira",
            userBalance: roundedUserBalance,
            requiredAmount: roundedAmountToPay,
            difference: roundedUserBalance - roundedAmountToPay
          });
        }
        
        console.log("✅ VERIFICAÇÃO DE SALDO DA CARTEIRA APROVADA:", {
          saldoDisponível: roundedUserBalance,
          valorPagamento: roundedAmountToPay,
          saldoRestante: roundedUserBalance - roundedAmountToPay
        });
      } 
      else if (selectedPaymentType === "bonus") {
        // Verificação de saldo de bônus
        if (roundedUserBonus < roundedAmountToPay) {
          console.log("❌ PAGAMENTO REJEITADO: Bônus insuficiente", {
            bonusDisponível: roundedUserBonus,
            valorPagamento: roundedAmountToPay,
            diferença: roundedUserBonus - roundedAmountToPay,
            tipoBonus: typeof roundedUserBonus,
            tipoPagamento: typeof roundedAmountToPay
          });
          
          return res.status(400).json({ 
            error: "Bônus insuficiente para realizar o pagamento",
            userBonus: roundedUserBonus,
            requiredAmount: roundedAmountToPay,
            difference: roundedUserBonus - roundedAmountToPay
          });
        }
        
        console.log("✅ VERIFICAÇÃO DE BÔNUS APROVADA:", {
          bonusDisponível: roundedUserBonus,
          valorPagamento: roundedAmountToPay,
          bonusRestante: roundedUserBonus - roundedAmountToPay
        });
      }
      else {
        // Tipo de pagamento não suportado
        console.log("❌ PAGAMENTO REJEITADO: Tipo de pagamento não suportado", {
          tipoPagamento: selectedPaymentType
        });
        
        return res.status(400).json({ 
          error: "Tipo de pagamento não suportado",
          paymentType: selectedPaymentType
        });
      }
      
      console.log("✅ VERIFICAÇÃO DE SALDO CONCLUÍDA COM SUCESSO:", {
        tipoPagamento: selectedPaymentType,
        saldoUtilizado: selectedPaymentType === "wallet" ? "Carteira" : "Bônus",
        saldoDisponível: selectedPaymentType === "wallet" ? roundedUserBalance : roundedUserBonus,
        valorPagamento: roundedAmountToPay
      });
      
      // Buscar o lojista através da tabela merchants
      const merchantQuery = await db
        .select({
          id: merchants.id,
          user_id: merchants.user_id,
          store_name: merchants.store_name,
          user_name: users.name
        })
        .from(merchants)
        .leftJoin(users, eq(merchants.user_id, users.id))
        .where(eq(merchants.id, merchant_id));
      
      if (!merchantQuery || merchantQuery.length === 0) {
        return res.status(404).json({ error: "Lojista não encontrado" });
      }
      
      const merchant = merchantQuery[0];
      
      try {
        // Verificar se o QR Code já tem uma transação associada
        const existingTransactions = await db.select()
          .from(transactions)
          .where(
            and(
              eq(transactions.user_id, client.id),
              eq(transactions.merchant_id, merchant_id),
              eq(transactions.status, "completed")
            )
          )
          .orderBy(desc(transactions.created_at))
          .limit(1);
          
        // Se já existe uma transação recente com os mesmos dados, pode ser uma transação duplicada
        const isRecentTransaction = existingTransactions.length > 0 && 
          (new Date().getTime() - new Date(existingTransactions[0].created_at).getTime() < 60000);
          
        if (isRecentTransaction) {
          console.log("Possível transação duplicada detectada, verificando QR code status");
          
          // Verificar se este QR code específico já foi marcado como usado
          if (qrCode.status === "used") {
            console.log("QR Code já processado anteriormente");
            return res.status(400).json({
              error: "Este pagamento já foi processado anteriormente"
            });
          }
        }
        
        // Buscar configurações de taxa atuais do banco
        const [settings] = await db.select().from(commissionSettings).limit(1);
        const platformFeeRate = parseFloat(settings?.platform_fee || "5.0") / 100;
        const clientCashbackRate = parseFloat(settings?.client_cashback || "2.0") / 100;
        const referralBonusRate = parseFloat(settings?.referral_bonus || "1.0") / 100;
        
        // Calcular todas as taxas conforme configurações do banco
        const fees = {
          clientCashback: amountValue * clientCashbackRate,
          platformFee: amountValue * platformFeeRate,
          referralBonus: amountValue * referralBonusRate,
          merchantReceives: amountValue - (amountValue * platformFeeRate)
        };
        
        console.log("Taxas calculadas para transação:", {
          valor: amountValue,
          cashback_cliente: fees.clientCashback,
          taxa_plataforma: fees.platformFee,
          bonus_indicacao: fees.referralBonus,
          lojista_recebe: fees.merchantReceives,
          taxas_aplicadas: {
            platform_fee_rate: platformFeeRate,
            client_cashback_rate: clientCashbackRate,
            referral_bonus_rate: referralBonusRate
          }
        });
        
        // Criar a transação com todas as taxas aplicadas
        const transactionInsert = await db.insert(transactions).values({
          user_id: client.id,
          merchant_id: merchant_id,
          amount: amountValue.toString(),
          cashback_amount: fees.clientCashback.toString(),
          status: "completed",
          payment_method: selectedPaymentType,
          description: `Pagamento para ${merchant.store_name || merchant.user_name || 'Lojista'}`,
          source: "qrcode",
          qr_code_id: qrCodeId
        }).returning();
        
        const transaction = transactionInsert[0];
        if (!transaction) {
          return res.status(500).json({ error: "Erro ao criar transação" });
        }
        
        console.log("Transação criada:", transaction);
        
        // Atualizar o status do QR code para "used" no banco de dados
        await db.update(qrCodes)
          .set({ 
            status: "used",
            used: true, 
            used_by: client.id
          })
          .where(eq(qrCodes.code, qrCodeId));
        
        console.log("QR code marcado como usado com sucesso:", qrCodeId);
        
        // Atualizar saldo do cliente
        if (clientCashbacks.length > 0) {
          const cashback = clientCashbacks[0];
          
          // Usar a mesma abordagem de Number e arredondamento que usamos para a verificação
          // Garantir que os tipos de dados sejam consistentes
          const currentBalance = Number(cashback.balance);
          const paymentAmount = Number(amountValue);
          
          // Calcular o novo saldo
          const newBalance = Math.round((currentBalance - paymentAmount) * 100) / 100;
          
          console.log("Atualizando saldo do cliente:", {
            clientId: client.id,
            saldoAtual: currentBalance,
            novoSaldo: newBalance,
            valorPagamento: paymentAmount,
            tipoSaldoAtual: typeof currentBalance,
            tipoNovoSaldo: typeof newBalance,
            tipoPagamento: typeof paymentAmount
          });
          
          // Verificar novamente se não ficará negativo (segurança extra)
          if (newBalance < 0) {
            console.error("ERRO CRÍTICO: Saldo ficaria negativo após a transação", {
              saldoAtual: currentBalance,
              valorPagamento: paymentAmount,
              saldoCalculado: newBalance
            });
            throw new Error("Saldo insuficiente para completar a transação");
          }
          
          // Atualizar o saldo do cliente usando o valor numérico convertido para string
          console.log("Atualizando saldo do cliente na tabela de cashbacks:", {
            cashback_id: cashback.id,
            valor_anterior: currentBalance,
            novo_valor: newBalance.toString()
          });
          
          try {
            await db.update(cashbacks)
              .set({ balance: newBalance.toString() })
              .where(eq(cashbacks.id, cashback.id));
              
            console.log("✅ Saldo do cliente atualizado com sucesso");
          } catch (updateError: unknown) {
            const errorMsg = updateError instanceof Error ? updateError.message : "Erro desconhecido";
            console.error("❌ Erro ao atualizar saldo do cliente:", errorMsg);
            throw new Error("Falha ao atualizar saldo do cliente: " + errorMsg);
          }
        }
        
        // Processar saldo do lojista com novo modelo de taxas (95% do valor)
        let merchantCashback;
        const merchantCashbacks = await db.select().from(cashbacks).where(eq(cashbacks.user_id, merchant.user_id));
        const merchantReceivesAmount = fees.merchantReceives; // 95% do valor após taxa da plataforma
        
        if (merchantCashbacks.length > 0) {
          merchantCashback = merchantCashbacks[0];
          const newMerchantBalance = parseFloat(merchantCashback.balance) + merchantReceivesAmount;
          
          console.log("Atualizando saldo do lojista (novo modelo - 95%):", {
            cashback_id: merchantCashback.id,
            valor_anterior: merchantCashback.balance,
            valor_transacao: amountValue,
            taxa_plataforma: fees.platformFee,
            lojista_recebe: merchantReceivesAmount,
            novo_saldo: newMerchantBalance.toString(),
            merchant_id
          });
          
          try {
            await db.update(cashbacks)
              .set({ 
                balance: newMerchantBalance.toString(),
                total_earned: (parseFloat(merchantCashback.total_earned) + merchantReceivesAmount).toString()
              })
              .where(eq(cashbacks.id, merchantCashback.id));
              
            console.log("✅ Saldo do lojista atualizado com novo modelo de taxas");
          } catch (updateError) {
            console.error("❌ Erro ao atualizar saldo do lojista:", updateError);
            throw new Error("Falha ao atualizar saldo do lojista");
          }
        } else {
          // Criar cashback para o lojista se não existir
          const merchantCashbackInsert = await db.insert(cashbacks).values({
            user_id: merchant_id,
            balance: merchantReceivesAmount.toString(),
            total_earned: merchantReceivesAmount.toString()
          }).returning();
          merchantCashback = merchantCashbackInsert[0];
          console.log("✅ Cashback do lojista criado com novo modelo (95%)");
        }
        
        // Registrar taxa da plataforma no sistema de controle
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        await db.execute(sql`
          INSERT INTO platform_fees (
            merchant_id, 
            transaction_id, 
            transaction_amount, 
            platform_fee_rate, 
            platform_fee_amount, 
            cashback_paid, 
            referral_paid, 
            net_platform_revenue,
            period_month,
            period_year,
            payment_status
          ) VALUES (
            ${merchant_id},
            ${transaction.id},
            ${amountValue},
            ${platformFeeRate * 100},
            ${fees.platformFee},
            ${fees.clientCashback},
            ${fees.referralBonus},
            ${fees.platformFee - fees.clientCashback - fees.referralBonus},
            ${currentMonth},
            ${currentYear},
            'pending'
          )
        `);
        
        console.log("✅ Taxa da plataforma registrada no sistema de controle:", {
          transaction_id: transaction.id,
          merchant_id: merchant_id,
          platform_fee: fees.platformFee,
          net_revenue: fees.platformFee - fees.clientCashback - fees.referralBonus
        });
        
        // Se estiver usando o saldo da carteira, criar um item de transação negativo (débito)
        await db.insert(transactionItems).values({
          transaction_id: transaction.id,
          product_name: selectedPaymentType === "wallet" ? "Pagamento via Carteira" : "Pagamento via Bônus",
          quantity: 1,
          price: amountValue.toString(),
          user_id: client.id,
          item_type: selectedPaymentType === "wallet" ? "wallet_payment" : "bonus_payment",
          amount: (-amountValue).toString(),
          description: `Pagamento para ${merchant.store_name || merchant.user_name || 'Lojista'}`,
          status: "completed"
        });
        
        // Adicionar valor para o lojista (crédito) - apenas o que ele recebe (95%)
        await db.insert(transactionItems).values({
          transaction_id: transaction.id,
          product_name: "Venda QR Code",
          quantity: 1,
          price: fees.merchantReceives.toString(),
          user_id: merchant.id,
          item_type: "merchant_sale",
          amount: fees.merchantReceives.toString(),
          description: `Pagamento de ${client.name} (95% após taxa da plataforma)`,
          status: "completed"
        });

        // Processar bônus de indicação se o cliente foi indicado
        const clientData = client as any; // Casting para acessar campo referral
        if (clientData.referred_by) {
          console.log("Processando bônus de indicação:", {
            cliente_id: client.id,
            indicador_id: clientData.referred_by,
            bonus_valor: fees.referralBonus
          });

          // Buscar o indicador
          const [referrer] = await db
            .select()
            .from(users)
            .where(eq(users.id, clientData.referred_by))
            .limit(1);

          if (referrer) {
            // Atualizar saldo do indicador
            const referrerCashbacks = await db
              .select()
              .from(cashbacks)
              .where(eq(cashbacks.user_id, referrer.id));

            if (referrerCashbacks.length > 0) {
              const referrerCashback = referrerCashbacks[0];
              const newReferrerBalance = parseFloat(referrerCashback.balance) + fees.referralBonus;

              await db.update(cashbacks)
                .set({ 
                  balance: newReferrerBalance.toString(),
                  total_earned: (parseFloat(referrerCashback.total_earned) + fees.referralBonus).toString()
                })
                .where(eq(cashbacks.id, referrerCashback.id));

              console.log("✅ Bônus de indicação processado:", {
                indicador: referrer.name,
                valor_bonus: fees.referralBonus,
                novo_saldo: newReferrerBalance
              });
            } else {
              // Criar cashback para o indicador se não existir
              await db.insert(cashbacks).values({
                user_id: referrer.id,
                balance: fees.referralBonus.toString(),
                total_earned: fees.referralBonus.toString()
              });

              console.log("✅ Cashback do indicador criado com bônus de indicação");
            }

            // Registrar a transação de bônus de indicação
            await db.insert(transactionItems).values({
              transaction_id: transaction.id,
              product_name: "Bônus de Indicação",
              quantity: 1,
              price: fees.referralBonus.toString(),
              user_id: referrer.id,
              item_type: "referral_bonus",
              amount: fees.referralBonus.toString(),
              description: `Bônus por indicação de ${client.name}`,
              status: "completed"
            });
          }
        }
        
        // Atualizar o status do QR Code
        console.log("Marcando QR Code como usado:", {
          qrCodeId: qrCode.code,
          client_id: client.id,
          transaction_id: transaction.id
        });
        
        await db.update(qrCodes)
          .set({ 
            status: "used",
            used_at: new Date(),
            used_by: client.id
          })
          .where(eq(qrCodes.code, qrCode.code));
        
        console.log("Pagamento processado com sucesso!", {
          transaction_id: transaction.id,
          amount: amountValue,
          client_id: client.id,
          merchant_id,
          payment_type: selectedPaymentType
        });
        
        return res.status(200).json({
          success: true,
          message: "Pagamento processado com sucesso",
          transaction_id: transaction.id,
          amount: amountValue,
          payment_type: selectedPaymentType,
          merchant_name: merchant.store_name || merchant.user_name || 'Lojista',
          date: new Date().toISOString()
        });
      } catch (txError: unknown) {
        console.error("Erro na transação:", txError);
        const errorMessage = txError instanceof Error 
          ? txError.message 
          : "Erro desconhecido";
        return res.status(500).json({ error: "Erro ao processar o pagamento: " + errorMessage });
      }
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      return res.status(500).json({ error: "Erro ao processar pagamento" });
    }
  });
  
  // Endpoint para verificar status de um pagamento (para o lojista)
  app.get("/api/merchant/payment/:id", isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Buscar a transação
      const [transaction] = await db.select().from(transactions).where(
        and(
          eq(transactions.id, parseInt(id)),
          eq(transactions.merchant_id, req.user?.id || 0)
        )
      );
      
      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }
      
      // Buscar os itens da transação
      const transactionDetails = await db.select().from(transactionItems)
        .where(eq(transactionItems.transaction_id, transaction.id));
      
      // Obter o cliente
      const [client] = await db.select().from(users).where(eq(users.id, transaction.user_id));
      
      return res.status(200).json({
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        created_at: transaction.created_at,
        payment_method: transaction.payment_method,
        client_name: client?.name || "Cliente",
        description: transaction.description,
        items: transactionDetails
      });
    } catch (error: any) {
      console.error("Erro ao verificar status do pagamento:", error);
      return res.status(500).json({ error: "Erro ao verificar status do pagamento" });
    }
  });
  
  // Novo endpoint para verificar status de um QR Code (para o lojista)
  app.get("/api/merchant/payment-qr/:code", isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      
      // Buscar o QR code
      const [qrCode] = await db.select().from(qrCodes).where(
        and(
          eq(qrCodes.code, code),
          eq(qrCodes.user_id, req.user?.id || 0)
        )
      );
      
      if (!qrCode) {
        return res.status(404).json({ error: "QR Code não encontrado" });
      }
      
      // Verificar se tem alguma transação associada
      let transaction = null;
      let client = null;
      
      if (qrCode.status === "used" && qrCode.used_by) {
        // Buscar transações onde o cliente é o que usou o QR code e o lojista é o dono do QR code
        // e onde o qr_code_id corresponde ao código do QR que estamos verificando
        const transactionsResult = await db.select().from(transactions).where(
          and(
            eq(transactions.user_id, qrCode.used_by),
            eq(transactions.merchant_id, qrCode.user_id),
            eq(transactions.qr_code_id, code)
          )
        ).orderBy(desc(transactions.created_at)).limit(1);
        
        if (transactionsResult.length > 0) {
          transaction = transactionsResult[0];
          // Buscar o cliente
          const clients = await db.select().from(users).where(eq(users.id, transaction.user_id));
          if (clients.length > 0) {
            client = clients[0];
          }
        }
      }
      
      // Dados do QR code
      const paymentData = qrCode.data ? JSON.parse(qrCode.data) : {};
      
      return res.status(200).json({
        id: qrCode.id,
        code: qrCode.code,
        amount: paymentData.amount || qrCode.amount,
        status: qrCode.status,
        created_at: qrCode.created_at,
        expires_at: qrCode.expires_at,
        used_at: qrCode.used_at,
        description: paymentData.description || qrCode.description,
        transaction: transaction ? {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          created_at: transaction.created_at,
          payment_method: transaction.payment_method,
          client_name: client?.name || "Cliente"
        } : null
      });
    } catch (error: any) {
      console.error("Erro ao verificar status do QR Code:", error);
      return res.status(500).json({ error: "Erro ao verificar status do QR Code" });
    }
  });
}