import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sih-user') || 'null'));
  useEffect(() => {
    if (localStorage.getItem('sih-token'))
      authService
        .me()
        .then((u) => {
          setUser(u);
          localStorage.setItem('sih-user', JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem('sih-token');
          localStorage.removeItem('sih-user');
          setUser(null);
        });
  }, []);
  const login = async (email, password) => {
    const u = await authService.login(email, password);
    setUser(u);
    localStorage.setItem('sih-user', JSON.stringify(u));
    return u;
  };
  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('sih-user');
  };
  const register = async (data) => {
    const u = await authService.register(data);
    setUser(u);
    localStorage.setItem('sih-user', JSON.stringify(u));
    return u;
  };
  return (
    <AuthContext.Provider
      value={{ user, role: user?.role, isAuthenticated: !!user, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
