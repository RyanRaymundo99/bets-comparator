'use client';

import React, { useState, useCallback } from 'react';
import NavbarNew from '@/components/ui/navbar-new';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/ui/breadcrumb';

const TradePage = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);
  // Estados para os valores das boletas
  const [buyBRL, setBuyBRL] = useState<string>('');
  const [sellUSDT, setSellUSDT] = useState<string>('');
  
  // Estado para o histórico de transações
  const [transactionHistory, setTransactionHistory] = useState<Array<{
    id: string;
    date: Date;
    type: 'buy' | 'sell';
    amount: number;
    received: number;
    fee: number;
    rate: number;
  }>>([]);
  
  // Constantes
  const USDT_PRICE = 5.50; // R$ 5,50 por USDT
  const FEE_RATE = 0.03; // 3% de taxa
  
  // Cálculos para compra (BRL → USDT)
  const buyAmountBRL = parseFloat(buyBRL) || 0;
  const buyFeeBRL = buyAmountBRL * FEE_RATE;
  const buyAmountAfterFee = buyAmountBRL - buyFeeBRL;
  const buyUSDTReceived = buyAmountAfterFee / USDT_PRICE;
  
  // Cálculos para venda (USDT → BRL)
  const sellAmountUSDT = parseFloat(sellUSDT) || 0;
  const sellAmountBRL = sellAmountUSDT * USDT_PRICE;
  const sellFeeBRL = sellAmountBRL * FEE_RATE;
  const sellBRLReceived = sellAmountBRL - sellFeeBRL;
  
  const handleBuyConfirm = () => {
    if (buyAmountBRL > 0) {
      // Adicionar transação ao histórico
      const newTransaction = {
        id: Date.now().toString(),
        date: new Date(),
        type: 'buy' as const,
        amount: buyAmountBRL,
        received: buyUSDTReceived,
        fee: buyFeeBRL,
        rate: USDT_PRICE,
      };
      
      setTransactionHistory(prev => [newTransaction, ...prev]);
      setBuyBRL(''); // Limpar o campo
      
      alert(`Compra confirmada!\nVocê receberá ${buyUSDTReceived.toFixed(2)} USDT por R$ ${buyAmountBRL.toFixed(2)}`);
    }
  };
  
  const handleSellConfirm = () => {
    if (sellAmountUSDT > 0) {
      // Adicionar transação ao histórico
      const newTransaction = {
        id: Date.now().toString(),
        date: new Date(),
        type: 'sell' as const,
        amount: sellAmountUSDT,
        received: sellBRLReceived,
        fee: sellFeeBRL,
        rate: USDT_PRICE,
      };
      
      setTransactionHistory(prev => [newTransaction, ...prev]);
      setSellUSDT(''); // Limpar o campo
      
      alert(`Venda confirmada!\nVocê receberá R$ ${sellBRLReceived.toFixed(2)} por ${sellAmountUSDT} USDT`);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#111] text-white">
      <NavbarNew isLoggingOut={isLoggingOut} handleLogout={handleLogout} />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Trade" },
          ]}
        />
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trade USDT</h1>
          <p className="text-[#A1A1AA]">Cotações em tempo real • Taxa de 3%</p>
        </div>
        
        {/* Grid de Boletas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Boleta de Compra */}
          <div className="bg-[#1E1E1E] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Comprar USDT</h2>
              <span className="text-sm text-[#A1A1AA]">1 USDT = R$ {USDT_PRICE.toFixed(2)}</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Valor em BRL
                </label>
                <input
                  type="number"
                  value={buyBRL}
                  onChange={(e) => setBuyBRL(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                />
              </div>
              
              <div className="text-sm text-[#A1A1AA] space-y-1">
                <div className="flex justify-between">
                  <span>Taxa (3%):</span>
                  <span>R$ {buyFeeBRL.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor após taxa:</span>
                  <span>R$ {buyAmountAfterFee.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-[#A1A1AA] mb-1">Você receberá:</div>
                <div className="text-2xl font-bold text-[#10B981]">
                  {buyUSDTReceived.toFixed(4)} USDT
                </div>
              </div>
              
              <button
                onClick={handleBuyConfirm}
                disabled={buyAmountBRL <= 0}
                className="w-full py-3 bg-[#10B981] hover:bg-[#059669] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                Comprar USDT
              </button>
            </div>
          </div>
          
          {/* Boleta de Venda */}
          <div className="bg-[#1E1E1E] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Vender USDT</h2>
              <span className="text-sm text-[#A1A1AA]">1 USDT = R$ {USDT_PRICE.toFixed(2)}</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Valor em USDT
                </label>
                <input
                  type="number"
                  value={sellUSDT}
                  onChange={(e) => setSellUSDT(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] transition-colors"
                />
              </div>
              
              <div className="text-sm text-[#A1A1AA] space-y-1">
                <div className="flex justify-between">
                  <span>Taxa (3%):</span>
                  <span>R$ {sellFeeBRL.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor bruto:</span>
                  <span>R$ {sellAmountBRL.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-[#A1A1AA] mb-1">Você receberá:</div>
                <div className="text-2xl font-bold text-[#EF4444]">
                  R$ {sellBRLReceived.toFixed(2)}
                </div>
              </div>
              
              <button
                onClick={handleSellConfirm}
                disabled={sellAmountUSDT <= 0}
                className="w-full py-3 bg-[#EF4444] hover:bg-[#DC2626] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                Vender USDT
              </button>
            </div>
          </div>
        </div>
        
        {/* Histórico de Transações */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Histórico de Transações</h2>
          
          {transactionHistory.length === 0 ? (
            <div className="bg-[#1E1E1E] rounded-xl p-8 border border-gray-800 text-center">
              <div className="text-[#A1A1AA] mb-2">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-[#A1A1AA]">Nenhuma transação realizada ainda</p>
              <p className="text-sm text-gray-600 mt-1">Suas transações aparecerão aqui</p>
            </div>
          ) : (
            <div className="bg-[#1E1E1E] rounded-xl border border-gray-800 overflow-hidden">
              {/* Header da tabela */}
              <div className="grid grid-cols-5 gap-4 p-4 bg-gray-900 border-b border-gray-800 text-sm font-medium text-[#A1A1AA]">
                <div>Data/Hora</div>
                <div>Tipo</div>
                <div>Valor</div>
                <div>Recebido</div>
                <div>Taxa</div>
              </div>
              
              {/* Lista de transações */}
              <div className="max-h-96 overflow-y-auto">
                {transactionHistory.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-5 gap-4 p-4 border-b border-gray-800 hover:bg-gray-900/50 transition-colors last:border-b-0"
                  >
                    {/* Data/Hora */}
                    <div className="text-sm">
                      <div className="text-white">
                        {transaction.date.toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-[#A1A1AA] text-xs">
                        {transaction.date.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    
                    {/* Tipo */}
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'buy' 
                          ? 'bg-green-900/30 text-green-400 border border-green-800' 
                          : 'bg-red-900/30 text-red-400 border border-red-800'
                      }`}>
                        {transaction.type === 'buy' ? 'Compra' : 'Venda'}
                      </span>
                    </div>
                    
                    {/* Valor */}
                    <div className="text-sm">
                      <div className="text-white">
                        {transaction.type === 'buy' 
                          ? `R$ ${transaction.amount.toFixed(2)}`
                          : `${transaction.amount.toFixed(4)} USDT`
                        }
                      </div>
                      <div className="text-[#A1A1AA] text-xs">
                        @ R$ {transaction.rate.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Recebido */}
                    <div className="text-sm">
                      <div className={`font-medium ${
                        transaction.type === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'buy' 
                          ? `${transaction.received.toFixed(4)} USDT`
                          : `R$ ${transaction.received.toFixed(2)}`
                        }
                      </div>
                    </div>
                    
                    {/* Taxa */}
                    <div className="text-sm text-[#A1A1AA]">
                      R$ {transaction.fee.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Informações adicionais */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#A1A1AA]">
            • As cotações são atualizadas em tempo real<br />
            • Taxa de 3% aplicada em todas as operações<br />
            • Confirmação imediata das transações
          </p>
        </div>
      </div>
    </div>
  );
};

export default TradePage;
