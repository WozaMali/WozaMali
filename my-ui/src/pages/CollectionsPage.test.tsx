import { render, screen } from '@testing-library/react';
import CollectionsPage from './CollectionsPage';

test('renders Collections page title', () => {
  render(<CollectionsPage />);
  expect(screen.getByText(/Collections/i)).toBeInTheDocument();
});
