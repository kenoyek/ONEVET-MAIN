import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it } from 'vitest';
import { CareChatLauncher } from '@/components/chat/CareChatLauncher';

it.each(['/', '/services', '/articles/care-guide', '/provider/public/local-vet'])(
  'opens the guest care chat from %s',
  path => {
    render(<MemoryRouter initialEntries={[path]}>
      <CareChatLauncher />
      <Routes><Route path="/care-chat" element={<h1>Care conversation</h1>} /></Routes>
    </MemoryRouter>);
    const launcher = screen.getByRole('link', { name: 'Chat with our care team' });
    expect(launcher).toHaveAttribute('href', '/care-chat');
    fireEvent.click(launcher);
    expect(screen.getByRole('heading', { name: 'Care conversation' })).toBeInTheDocument();
    expect(launcher).not.toBeInTheDocument();
  },
);

it.each(['/auth', '/auth/callback', '/admin/care-chat', '/checkout', '/urgent-care', '/services/groomers'])(
  'keeps the launcher off %s',
  path => {
    render(<MemoryRouter initialEntries={[path]}><CareChatLauncher /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: 'Chat with our care team' })).not.toBeInTheDocument();
  },
);
