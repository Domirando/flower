import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dialogs from './Dialogs';
import '@testing-library/jest-dom';

describe('Dialogs Component', () => {
    const mockState = {
        dialogs: [
            { id: 1, name: 'Dmitry', avatar: 'https://example.com/avatar.jpg' }
        ],
        messages: [
            { id: 1, message: 'Hi' }
        ],
        newDialogMessage: ''
    };

    const mockUpdateNewMessage = jest.fn();
    const mockAddMessage = jest.fn();

    test('renders dialogs and messages', () => {
        render(
            <MemoryRouter>
                <Dialogs 
                    state={mockState} 
                    updateNewMessage={mockUpdateNewMessage} 
                    addMessage={mockAddMessage} 
                    messages={mockState} 
                />
            </MemoryRouter>
        );

        expect(screen.getByText('Dmitry')).toBeInTheDocument();
        expect(screen.getByText('Hi')).toBeInTheDocument();
    });

    test('calls updateNewMessage on textarea change', () => {
        render(
            <MemoryRouter>
                <Dialogs 
                    state={mockState} 
                    updateNewMessage={mockUpdateNewMessage} 
                    addMessage={mockAddMessage} 
                    messages={mockState} 
                />
            </MemoryRouter>
        );

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'New message' } });

        expect(mockUpdateNewMessage).toHaveBeenCalledWith('New message');
    });

    test('calls addMessage on button click', () => {
        render(
            <MemoryRouter>
                <Dialogs 
                    state={mockState} 
                    updateNewMessage={mockUpdateNewMessage} 
                    addMessage={mockAddMessage} 
                    messages={mockState} 
                />
            </MemoryRouter>
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(mockAddMessage).toHaveBeenCalled();
    });
});
