import EnhancedTable from '@/components/common/EnhancedTable'
import { useMemo, useState } from 'react'
import type { AddressEntry } from '@/components/address-book/EntryDialog'
import EntryDialog from '@/components/address-book/EntryDialog'
import ExportDialog from '@/components/address-book/ExportDialog'
import ImportDialog from '@/components/address-book/ImportDialog'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import RemoveDialog from '@/components/address-book/RemoveDialog'
import useIsGranted from '@/hooks/useIsGranted'
import NewTxModal from '@/components/tx/modals/NewTxModal'
import css from './styles.module.css'
import EthHashInfo from '@/components/common/EthHashInfo'
import AddressBookHeader from '../AddressBookHeader'
import useAddressBook from '@/hooks/useAddressBook'
import Track from '@/components/common/Track'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import SvgIcon from '@mui/material/SvgIcon'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import AddressBookIcon from '@/public/images/address-book/address-book.svg'
import { useCurrentChain } from '@/hooks/useChains'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'

const headCells = [
  { id: 'name', label: 'Name' },
  { id: 'address', label: 'Address' },
  { id: 'actions', label: '' },
]

export enum ModalType {
  EXPORT = 'export',
  IMPORT = 'import',
  ENTRY = 'entry',
  REMOVE = 'remove',
}

const defaultOpen = {
  [ModalType.EXPORT]: false,
  [ModalType.IMPORT]: false,
  [ModalType.ENTRY]: false,
  [ModalType.REMOVE]: false,
}

const AddressBookTable = () => {
  const chain = useCurrentChain()
  const isGranted = useIsGranted()
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const [searchQuery, setSearchQuery] = useState('')
  const [defaultValues, setDefaultValues] = useState<AddressEntry | undefined>(undefined)
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>()

  const handleOpenModal = (type: keyof typeof open) => () => {
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleOpenModalWithValues = (modal: ModalType, address: string, name: string) => {
    setDefaultValues({ address, name })
    handleOpenModal(modal)()
  }

  const handleClose = () => {
    setOpen(defaultOpen)
    setDefaultValues(undefined)
  }

  const addressBook = useAddressBook()
  const addressBookEntries = Object.entries(addressBook)
  const filteredEntries = useMemo(() => {
    if (!searchQuery) {
      return addressBookEntries
    }

    const query = searchQuery.toLowerCase()
    return addressBookEntries.filter(([address, name]) => {
      return address.toLowerCase().includes(query) || name.toLowerCase().includes(query)
    })
  }, [addressBookEntries, searchQuery])

  const rows = filteredEntries.map(([address, name]) => ({
    name: {
      rawValue: name,
      content: name,
    },
    address: {
      rawValue: address,
      content: <EthHashInfo address={address} showName={false} shortAddress={false} hasExplorer showCopyButton />,
    },
    actions: {
      rawValue: '',
      sticky: true,
      content: (
        <div className={tableCss.actions}>
          <Track {...ADDRESS_BOOK_EVENTS.EDIT_ENTRY}>
            <Tooltip title="Edit entry" placement="top">
              <IconButton onClick={() => handleOpenModalWithValues(ModalType.ENTRY, address, name)} size="small">
                <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
              </IconButton>
            </Tooltip>
          </Track>

          <Track {...ADDRESS_BOOK_EVENTS.DELETE_ENTRY}>
            <Tooltip title="Delete entry" placement="top">
              <IconButton onClick={() => handleOpenModalWithValues(ModalType.REMOVE, address, name)} size="small">
                <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
              </IconButton>
            </Tooltip>
          </Track>

          {isGranted && (
            <Track {...ADDRESS_BOOK_EVENTS.SEND}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => setSelectedAddress(address)}
                className={css.sendButton}
              >
                Send
              </Button>
            </Track>
          )}
        </div>
      ),
    },
  }))

  return (
    <>
      <AddressBookHeader
        handleOpenModal={handleOpenModal}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <main>
        {filteredEntries.length > 0 ? (
          <EnhancedTable rows={rows} headCells={headCells} />
        ) : (
          <PagePlaceholder
            img={<AddressBookIcon />}
            text={`No entries found${chain ? ` on ${chain.chainName}` : ''}`}
          />
        )}
      </main>

      {open[ModalType.EXPORT] && <ExportDialog handleClose={handleClose} />}

      {open[ModalType.IMPORT] && <ImportDialog handleClose={handleClose} />}

      {open[ModalType.ENTRY] && (
        <EntryDialog
          handleClose={handleClose}
          defaultValues={defaultValues}
          disableAddressInput={Boolean(defaultValues?.name)}
        />
      )}

      {open[ModalType.REMOVE] && <RemoveDialog handleClose={handleClose} address={defaultValues?.address || ''} />}

      {/* Send funds modal */}
      {selectedAddress && <NewTxModal onClose={() => setSelectedAddress(undefined)} recipient={selectedAddress} />}
    </>
  )
}

export default AddressBookTable
