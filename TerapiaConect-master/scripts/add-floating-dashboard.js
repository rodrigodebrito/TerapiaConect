/**
 * INSTRUÇÕES PARA ADICIONAR O DASHBOARD FLUTUANTE DE CONSTELAÇÃO
 * 
 * Este script contém instruções passo a passo para adicionar o dashboard flutuante
 * de teste da Constelação Familiar à aplicação, sem precisar modificar páginas específicas.
 * 
 * Execute os comandos abaixo no terminal, um por vez:
 */

/*
 * 1. Abra o arquivo App.jsx:
 */
// código: code frontend/src/App.jsx

/*
 * 2. Adicione a importação do componente no início do arquivo, junto com as outras importações:
 */
// import ConstellationTestDashboard from './components/ConstellationTestDashboard';

/*
 * 3. Adicione o componente do dashboard flutuante logo antes do fechamento do componente App,
 *    acima do </AuthProvider>:
 */
// Dentro da função App:
// return (
//   <AuthProvider>
//     <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
//       <Routes>
//         {/* ... rotas ... */}
//       </Routes>
//     </Router>
//     <ConstellationTestDashboard />  {/* Adicione esta linha */}
//     <ToastContainer />
//   </AuthProvider>
// );

/*
 * 4. Salve o arquivo
 * 
 * 5. Reinicie o servidor de desenvolvimento, se necessário:
 */
// npm run dev

/**
 * OPCIONAL: ATIVAR APENAS PARA TERAPEUTAS
 * 
 * Se quiser que o dashboard flutuante apareça apenas para terapeutas,
 * modifique o código para verificar o papel do usuário:
 * 
 * // Dentro da função App:
 * const { user } = useAuth();
 * 
 * return (
 *   <AuthProvider>
 *     <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
 *       <Routes>
 *         {/* ... rotas ... *\/}
 *       </Routes>
 *     </Router>
 *     {user && user.role === 'THERAPIST' && <ConstellationTestDashboard />}
 *     <ToastContainer />
 *   </AuthProvider>
 * );
 */ 