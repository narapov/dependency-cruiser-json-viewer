import { forwardRef, useImperativeHandle, useRef, type ChangeEvent } from 'react'

export interface CruiseResultFileInputHandle {
  open: () => void
}

interface CruiseResultFileInputProps {
  onFileSelect: (file: File) => void
}

export const CruiseResultFileInput = forwardRef<
  CruiseResultFileInputHandle,
  CruiseResultFileInputProps
>(function CruiseResultFileInput({ onFileSelect }, ref) {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    open: () => {
      inputRef.current?.click()
    },
  }))

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <input
      ref={inputRef}
      type="file"
      accept=".json,application/json"
      hidden
      onChange={handleChange}
    />
  )
})
