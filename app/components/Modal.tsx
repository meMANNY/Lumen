'use client';

import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { IoClose } from 'react-icons/io5'

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="
              fixed
              inset-0
              bg-black/60
              backdrop-blur-sm
              transition-opacity
            "
          />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div 
            className="
              flex 
              min-h-full 
              items-center 
              justify-center 
              p-4 
              text-center 
              sm:p-0
            "
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className="
                  relative
                  transform
                  overflow-hidden
                  rounded-[28px]
                  border
                  border-white/10
                  bg-[#10121d]/95
                  px-6
                  pb-6
                  pt-6
                  text-left
                  font-sans
                  text-slate-100
                  shadow-[0_24px_100px_rgba(0,0,0,0.6)]
                  backdrop-blur-2xl
                  transition-all
                  w-full
                  sm:my-8
                  sm:w-full
                  sm:max-w-lg
                  sm:p-8
                "
              >
                <div
                  className="
                    absolute
                    right-0
                    top-0
                    pr-5
                    pt-5
                    z-10
                  "
                >
                  <button
                    type="button"
                    className="
                      grid
                      size-9
                      place-items-center
                      rounded-xl
                      text-slate-400
                      transition
                      hover:bg-white/[0.07]
                      hover:text-white
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-violet-400/50
                    "
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <IoClose className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default Modal;