import React from 'react';
import {createRoot} from 'react-dom/client';
import Manager from './manager';
import Login from './login';
import {readToken} from './client-api';
import './globals.css';
const path=location.pathname.replace(/\/$/,'');
const mode=path.endsWith('/configurar')?'setup':path.endsWith('/senha')?'password':path.endsWith('/entrar')||!readToken()?'login':null;
createRoot(document.getElementById('root')!).render(mode?<Login mode={mode}/>:<Manager/>);
