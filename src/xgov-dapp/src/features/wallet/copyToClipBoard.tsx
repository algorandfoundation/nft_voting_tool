import { DocumentDuplicateIcon } from '@heroicons/react/24/solid'
import { Snackbar } from '@mui/material'
import { useState } from 'react'

export default function CopyToClipBoard(props: { valueToCopy: string; className: string }) {
  const [isCopiedSuccessfully, setIsCopiedSuccessfully] = useState(false)
  return (
    <div className="cursor-pointer">
      <div
        className={props.className}
        onClick={() => navigator.clipboard.writeText(props.valueToCopy).then(() => setIsCopiedSuccessfully(true))}
      >
        <DocumentDuplicateIcon data-tooltip-target="tooltip-default" />
        <ToolTip value={props.valueToCopy} />
      </div>
      {isCopiedSuccessfully && (
        <Snackbar
          open={isCopiedSuccessfully}
          autoHideDuration={2000}
          message="Value copied successfully"
          onClose={() => setIsCopiedSuccessfully(false)}
        />
      )}
    </div>
  )
}

function ToolTip(props: { value: string }) {
  return (
    <div
      id="tooltip-default"
      role="tooltip"
      className="w-fit inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-grey rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-grey-dark"
    >
      {props.value}
    </div>
  )
}
