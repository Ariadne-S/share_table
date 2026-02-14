import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PageErrorBoundary } from './components/PageErrorBoundary';
import CreateTablePage from './pages/CreateTablePage';
import TableViewPage from './pages/TableViewPage';
import TablesListPage from './pages/TablesListPage';

function App() {
  return (
    <>
      <OfflineIndicator />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PageErrorBoundary pageName="Tables List">
                <Layout>
                  <TablesListPage />
                </Layout>
              </PageErrorBoundary>
            }
          />
          <Route
            path="/create"
            element={
              <PageErrorBoundary pageName="Create Table">
                <Layout>
                  <CreateTablePage />
                </Layout>
              </PageErrorBoundary>
            }
          />
          <Route
            path="/t/:shareToken"
            element={
              <PageErrorBoundary pageName="Table View">
                <Layout>
                  <TableViewPage />
                </Layout>
              </PageErrorBoundary>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
