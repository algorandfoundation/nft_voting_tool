import { fireEvent, render, screen, waitFor } from '../../utils/test-utils'
import RoundInfo from './RoundInfo'
import { VoteCreationSteps } from './VoteCreationSteps'

describe('create vote', () => {
  describe('round info', () => {
    describe('title', () => {
      it('should fail if empty', async () => {
        render(<RoundInfo />)

        fireEvent.submit(screen.getByRole('button', { name: 'Next' }))

        await waitFor(() => expect(screen.getByRole('textbox', { name: 'Vote title' })).toBeInvalid())
      })
      it('should validate when not empty', async () => {
        render(<RoundInfo />)
        fireEvent.submit(screen.getByRole('button', { name: 'Next' }))
        await waitFor(() => expect(screen.getByRole('textbox', { name: 'Vote title' })).toBeInvalid())

        fireEvent.change(screen.getByRole('textbox', { name: 'Vote title' }), { target: { value: 'some value' } })

        await waitFor(() => expect(screen.getByRole('textbox', { name: 'Vote title' })).toBeValid())
      })

      it('should fail if only spaces', async () => {
        render(<RoundInfo />)

        fireEvent.change(screen.getByRole('textbox', { name: 'Vote title' }), { target: { value: '    ' } })
        fireEvent.submit(screen.getByRole('button', { name: 'Next' }))

        await waitFor(() => expect(screen.getByRole('textbox', { name: 'Vote title' })).toBeInvalid())
      })

      it('should be required', async () => {
        render(<RoundInfo />)

        fireEvent.change(screen.getByRole('textbox', { name: 'Vote title' }), { target: { value: 'some value' } })
        fireEvent.submit(screen.getByRole('button', { name: 'Next' }))

        await waitFor(() => expect(screen.getByRole('textbox', { name: 'Vote information URL' })).toBeInvalid())
      })
      it('should trim spaces', async () => {
        render(<RoundInfo />)

        fireEvent.submit(screen.getByRole('button', { name: 'Next' }))

        await waitFor(() => expect(screen.getByRole('textbox', { name: 'Vote title' })).toBeInvalid())
      })
    })
    describe('vote information url', () => {
      it('should fail validation on bad url', async () => {
        render(<RoundInfo />)

        fireEvent.change(screen.getByRole('textbox', { name: 'Vote information URL' }), { target: { value: 'not-a-url' } })
        fireEvent.submit(screen.getByRole('button', { name: 'Next' }))

        await waitFor(() => expect(screen.getByRole('textbox', { name: 'Vote information URL' })).toBeInvalid())
      })
    })
    describe('when all required fields are filled in', () => {
      it('should validate', async () => {
        const recoil = jest.fn()
        render(<RoundInfo />, { onRecoilChange: recoil })

        fireEvent.change(screen.getByRole('textbox', { name: 'Vote title' }), { target: { value: 'My vote title' } })
        fireEvent.change(screen.getByRole('textbox', { name: 'Vote description' }), { target: { value: 'My vote description' } })
        fireEvent.change(screen.getByRole('textbox', { name: 'Vote information URL' }), { target: { value: 'https://example.com' } })
        fireEvent.change(screen.getByRole('textbox', { name: 'Start' }), { target: { value: '03/22/2023 12:00 AM' } })
        fireEvent.change(screen.getByRole('textbox', { name: 'End' }), { target: { value: '03/22/2023 12:00 AM' } })
        fireEvent.submit(screen.getByRole('button', { name: 'Next' }))

        await waitFor(() => expect(recoil).toBeCalledWith(expect.objectContaining({ step: VoteCreationSteps.Questions })))
      })
    })
  })
})
