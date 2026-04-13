"use client"
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Sparkles, LayoutDashboard, PieChart as ChartIcon, CalendarDays, CreditCard, Coins, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase'; // Pastikan path ini sesuai dengan folder lib kamu

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State Data
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // State Form
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Makanan 🍔');
  const [account, setAccount] = useState('Bank');
  
  // State Filter
  const [filterPeriod, setFilterPeriod] = useState('all'); 

  const categories = {
    expense: ['Makanan 🍔', 'Transport 🚗', 'Belanja 🛍️', 'Tagihan 📄', 'Lainnya 🧩'],
    income: ['Gaji 💰', 'Bonus 🎁', 'Pemberian 💌', 'Lainnya 🧩']
  };

  // AMBIL DATA DARI SUPABASE
  const fetchTransactions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      setTransactions(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsClient(true);
    fetchTransactions();
  }, []);

  // TAMBAH DATA KE SUPABASE
  const addTransaction = async (e) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newTx = {
      description: desc,
      amount: parseFloat(amount),
      type: type,
      category: category,
      account: account,
      displayDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([newTx])
      .select();

    if (error) {
      alert("Gagal menyimpan data ke database: " + error.message);
    } else if (data) {
      setTransactions([data[0], ...transactions]);
      setDesc('');
      setAmount('');
    }
  };

  // HAPUS DATA DARI SUPABASE
  const deleteTransaction = async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Gagal menghapus data: " + error.message);
    } else {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  // --- LOGIC FILTER & STATS ---
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const filteredTransactions = transactions.filter(t => {
    if (filterPeriod === 'all') return true;
    const tDate = new Date(t.created_at); // Supabase otomatis bikin created_at
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const calculateBalance = (accType) => {
    return transactions
      .filter(t => accType === 'All' || t.account === accType)
      .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  };

  const globalBalance = calculateBalance('All');
  const bankBalance = calculateBalance('Bank');
  const cashBalance = calculateBalance('Cash');

  const income = filteredTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

  // --- DATA GRAFIK ---
  const barChartData = [{ name: 'Ringkasan', Pemasukan: income, Pengeluaran: expense }];
  const expenseByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
  const pieChartData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));
  const COLORS = ['#f472b6', '#c084fc', '#60a5fa', '#34d399', '#fbbf24'];

  if (!isClient) return null;

  return (
    <main className="min-h-screen bg-[#fff0f5] text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-4 rounded-full shadow-sm text-pink-500">
              <Sparkles size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Catatan Keuangan Fina 🌸</h1>
              <p className="text-slate-500 font-medium mt-1">Data tersimpan aman di Cloud Supabase!</p>
            </div>
          </div>

          {/* TABS */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border-2 border-pink-100">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-pink-100 text-pink-600' : 'text-slate-400'}`}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-purple-100 text-purple-600' : 'text-slate-400'}`}>
              <ChartIcon size={18} /> Analitik
            </button>
          </div>
        </header>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="flex items-center justify-center p-20 text-pink-500">
            <Loader2 className="animate-spin mr-2" size={32} />
            <span className="font-bold">Menghubungkan ke database...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {/* STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-pink-100">
                <div className="flex items-center gap-2 text-pink-500 mb-2">
                  <Wallet size={18} /> <span className="text-[10px] font-bold uppercase tracking-wider">Total Saldo</span>
                </div>
                <p className={`text-xl font-black ${globalBalance < 0 ? 'text-rose-500' : 'text-slate-800'}`}>Rp {globalBalance.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-blue-50 p-5 rounded-3xl border-2 border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <CreditCard size={18} /> <span className="text-[10px] font-bold uppercase tracking-wider">Bank</span>
                </div>
                <p className="text-xl font-bold">Rp {bankBalance.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-amber-50 p-5 rounded-3xl border-2 border-amber-100">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Coins size={18} /> <span className="text-[10px] font-bold uppercase tracking-wider">Tunai</span>
                </div>
                <p className="text-xl font-bold">Rp {cashBalance.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-rose-50 p-5 rounded-3xl border-2 border-rose-100">
                <div className="flex items-center gap-2 text-rose-500 mb-2">
                  <ArrowDownCircle size={18} /> <span className="text-[10px] font-bold uppercase tracking-wider">Bulan Ini</span>
                </div>
                <p className="text-xl font-bold text-rose-700">Rp {expense.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border-2 border-pink-100 h-fit sticky top-6">
                  <h3 className="text-lg font-bold mb-5 flex items-center gap-2"> <PlusCircle size={20} className="text-pink-400" /> Baru </h3>
                  <form onSubmit={addTransaction} className="space-y-4">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                      <button type="button" onClick={() => { setType('expense'); setCategory(categories.expense[0]); }} className={`flex-1 py-2 rounded-xl text-xs font-bold ${type === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}>Keluar</button>
                      <button type="button" onClick={() => { setType('income'); setCategory(categories.income[0]); }} className={`flex-1 py-2 rounded-xl text-xs font-bold ${type === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-400'}`}>Masuk</button>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAccount('Bank')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold border-2 ${account === 'Bank' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-transparent bg-slate-50 text-slate-400'}`}>BANK</button>
                      <button type="button" onClick={() => setAccount('Cash')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold border-2 ${account === 'Cash' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'border-transparent bg-slate-50 text-slate-400'}`}>TUNAI</button>
                    </div>
                    <input type="text" required placeholder="Keterangan" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-pink-100 transition-all text-sm font-medium" value={desc} onChange={(e) => setDesc(e.target.value)} />
                    <input type="number" required placeholder="Nominal" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-pink-100 text-sm font-medium" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-medium text-slate-600" value={category} onChange={(e) => setCategory(e.target.value)}>
                      {categories[type].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-200"> Simpan Ke Cloud </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border-2 border-pink-100">
                  <h3 className="text-lg font-bold mb-6">Daftar Transaksi</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
                        <tr><th className="p-4">Tanggal</th><th className="p-4">Sumber</th><th className="p-4">Kategori</th><th className="p-4">Keterangan</th><th className="p-4 text-right">Nominal</th><th className="p-4 text-center">Aksi</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-pink-50/50 transition-colors">
                            <td className="p-4 text-xs text-slate-500">{t.displayDate}</td>
                            <td className="p-4 text-[10px] font-bold text-center">
                              <span className={`px-2 py-1 rounded ${t.account === 'Bank' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>{t.account.toUpperCase()}</span>
                            </td>
                            <td className="p-4 text-xs font-medium"><span className="bg-white px-2 py-1 border rounded-full text-[10px]">{t.category}</span></td>
                            <td className="p-4 text-sm font-medium">{t.description}</td>
                            <td className={`p-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}</td>
                            <td className="p-4 text-center"><button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
                <div className="bg-white p-8 rounded-3xl border-2 border-purple-100 h-96">
                   <h3 className="text-center font-bold mb-6">Tren Pengeluaran</h3>
                   <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" /> <YAxis hide /> <Tooltip /> <Legend />
                      <Bar dataKey="Pemasukan" fill="#34d399" radius={[4, 4, 4, 4]} />
                      <Bar dataKey="Pengeluaran" fill="#fb7185" radius={[4, 4, 4, 4]} />
                    </BarChart>
                   </ResponsiveContainer>
                </div>
                <div className="bg-white p-8 rounded-3xl border-2 border-purple-100 h-96">
                   <h3 className="text-center font-bold mb-6">Distribusi Kategori</h3>
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieChartData} innerRadius={60} outerRadius={80} dataKey="value">
                        {pieChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip /> <Legend />
                    </PieChart>
                   </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}