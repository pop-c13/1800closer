import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LoginPage from './components/LoginPage';
import LaunchScreen from './components/LaunchScreen';
import PresenterPanel from './components/PresenterPanel';
import ViewerView from './components/ViewerView';
import ManagerHub from './components/ManagerHub';
import ManagerLiveView from './components/ManagerLiveView';
import RepDetailView from './components/RepDetailView';
import ExecutiveCommandCenter from './components/ExecutiveCommandCenter';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="font-dm min-h-screen">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<LaunchScreen />} />
            <Route path="/present" element={<PresenterPanel />} />
            <Route path="/viewer" element={<ViewerView />} />
            <Route path="/manager" element={<ManagerHub />} />
            <Route path="/manager/live/:id" element={<ManagerLiveView />} />
            <Route path="/manager/rep/:repId" element={<RepDetailView />} />
            <Route path="/executive" element={<ExecutiveCommandCenter />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
