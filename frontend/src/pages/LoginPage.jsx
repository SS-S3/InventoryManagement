import React from 'react';
import HeroSectionOne from '../components/HeroSectionOne';
import AuthForm from '../components/AuthForm';
import HeroActions from '../components/ui/HeroActions';

const LoginPage = ({ setToken }) => {
  return (
    <HeroSectionOne title={"Welcome Back"} subtitle={"Sign in to manage lab inventory"}>
      <div className="flex flex-col items-center gap-4">
        <HeroActions />
        <AuthForm setToken={setToken} />
      </div>
    </HeroSectionOne>
  );
};

export default LoginPage;
