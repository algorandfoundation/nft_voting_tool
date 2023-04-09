import { Navigate, Outlet } from 'react-router-dom'
import { useConnectedWallet, useCreatorAddresses } from '../../features/wallet/state'

export default function RequireCreator() {
  const creatorAddresses = useCreatorAddresses()
  const connectedWallet = useConnectedWallet()
  const isCreator = connectedWallet && (creatorAddresses.includes(connectedWallet) || creatorAddresses.includes('any'))

  return isCreator === true ? <Outlet /> : <Navigate to="/" replace />
}
