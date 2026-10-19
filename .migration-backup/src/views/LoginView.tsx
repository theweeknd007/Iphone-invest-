import React from 'react';
import { AuthView } from './AuthView';

export const LoginView: React.FC = () => {
  return <AuthView initialMode="login" />;
};
