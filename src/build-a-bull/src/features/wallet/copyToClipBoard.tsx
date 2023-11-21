import { DocumentDuplicateIcon } from '@heroicons/react/24/solid'
import { Snackbar } from '@mui/material'
import clsx from 'clsx'
import { useState } from 'react'

export default function CopyToClipBoard(props: { valueToCopy: string; className: string }) {
  const [isCopiedSuccessfully, setIsCopiedSuccessfully] = useState(false)
  return (
    <>
      <span
        className={clsx('cursor-pointer inline-block', props.className)}
        onClick={() => navigator.clipboard.writeText(props.valueToCopy).then(() => setIsCopiedSuccessfully(true))}
      >
        <DocumentDuplicateIcon data-tooltip-target="tooltip-default" />
      </span>
      {isCopiedSuccessfully && (
        <Snackbar
          open={isCopiedSuccessfully}
          autoHideDuration={2000}
          message="Value copied successfully"
          onClose={() => setIsCopiedSuccessfully(false)}
        />
      )}
    </>
  )
}
