import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreateTablePage from './pages/CreateTablePage';
import TableViewPage from './pages/TableViewPage';
import TablesListPage from './pages/TablesListPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TablesListPage />} />
        <Route path="/create" element={<CreateTablePage />} />
        <Route path="/t/:shareToken" element={<TableViewPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
