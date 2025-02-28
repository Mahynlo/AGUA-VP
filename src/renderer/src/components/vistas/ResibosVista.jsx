import React from "react";

const Resibos = () => {
  return (
    <div class="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div class="text-2xl font-bold text-gray-900 dark:text-white">
        Resibos
      </div>
      <div class="flex flex-col space-y-8 mt-6">

        <div class="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 px-4 xl:p-0 gap-y-4 md:gap-6">
          <div class="md:col-span-2 xl:col-span-3 bg-white p-6 rounded-2xl border border-gray-50">
            <div class="flex flex-col space-y-6 md:h-full md:justify-between">
              <div class="flex justify-between">
                <span class="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Main Account
                </span>
                <span class="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Available Funds
                </span>
              </div>
              <div class="flex gap-2 md:gap-4 justify-between items-center">
                <div class="flex flex-col space-y-4">
                  <h2 class="text-gray-800 font-bold tracking-widest leading-tight">Derol's Savings
                    Account</h2>
                  <div class="flex items-center gap-4">
                    <p class="text-lg text-gray-600 tracking-wider">**** **** *321</p>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                <h2 class="text-lg md:text-xl xl:text-3xl text-gray-700 font-black tracking-wider">
                  <span class="md:text-xl">$</span>
                  92,817.45
                </h2>
              </div>
              <div class="flex gap-2 md:gap-4">
                <a href="#"
                  class="bg-blue-600 px-5 py-3 w-full text-center md:w-auto rounded-lg text-white text-xs tracking-wider font-semibold hover:bg-blue-800">
                  Transfer Money
                </a>
                <a href="#"
                  class="bg-blue-50 px-5 py-3 w-full text-center md:w-auto rounded-lg text-blue-600 text-xs tracking-wider font-semibold hover:bg-blue-600 hover:text-white">
                  Link Account
                </a>
              </div>
            </div>
          </div>
          <div
            class="col-span-2 p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-800 flex flex-col justify-between">
            <div class="flex flex-col">
              <p class="text-white font-bold">Lorem ipsum dolor sit amet</p>
              <p class="mt-1 text-xs md:text-sm text-gray-50 font-light leading-tight max-w-sm">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio soluta saepe consequuntur
                facilis ab a. Molestiae ad saepe assumenda praesentium rem dolore? Exercitationem, neque
                obcaecati?
              </p>
            </div>
            <div class="flex justify-between items-end">
              <a href="#"
                class="bg-blue-800 px-4 py-3 rounded-lg text-white text-xs tracking-wider font-semibold hover:bg-blue-600 hover:text-white">
                Learn More
              </a>
              imagen
            </div>
          </div>

        </div>
      </div>


      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 px-4 xl:p-0 gap-4 xl:gap-6 mt-2">
        <div class="col-span-1 md:col-span-2 lg:col-span-4 flex justify-between">
          <h2 class="text-xs md:text-sm text-gray-700 font-bold tracking-wide md:tracking-wider">
            Expenses By Category</h2>
          <a href="#" class="text-xs text-gray-800 font-semibold uppercase">More</a>
        </div>
        <div class="bg-white p-6 rounded-xl border border-gray-50 dark:bg-gray-800 dark:border-gray-500">
          <div class="flex justify-between items-start">
            <div class="flex flex-col">
              <p class="text-xs text-gray-600 tracking-wide">Foods & Beverages</p>
              <h3 class="mt-1 text-lg text-blue-500 font-bold">$ 818</h3>
              <span class="mt-4 text-xs text-gray-500">Last Transaction 3 Hours ago</span>
            </div>
            <div class="bg-blue-500 p-2 md:p-1 xl:p-2 rounded-md">
              imagen
            </div>
          </div>
        </div>
        <div class="bg-white p-6 rounded-xl border border-gray-50 dark:bg-gray-800 dark:border-gray-500">
          <div class="flex justify-between items-start">
            <div class="flex flex-col">
              <p class="text-xs text-gray-600 tracking-wide">Groceries</p>
              <h3 class="mt-1 text-lg text-green-500 font-bold">$ 8,918</h3>
              <span class="mt-4 text-xs text-gray-500">Last Transaction 3 Days ago</span>
            </div>
            <div class="bg-green-500 p-2 md:p-1 xl:p-2 rounded-md">
              imagen
            </div>
          </div>
        </div>
        <div class="bg-white p-6 rounded-xl border border-gray-50  dark:bg-gray-800 dark:border-gray-500">
          <div class="flex justify-between items-start">
            <div class="flex flex-col">
              <p class="text-xs text-gray-600 tracking-wide">Gaming</p>
              <h3 class="mt-1 text-lg text-yellow-500 font-bold">$ 1,223</h3>
              <span class="mt-4 text-xs text-gray-600">Last Transaction 4 Days ago</span>
            </div>
            <div class="bg-yellow-500 p-2 md:p-1 xl:p-2 rounded-md">
              imagen
            </div>
          </div>
        </div>
        <div class="bg-white p-6 rounded-xl border border-gray-50 dark:bg-gray-800 dark:border-gray-500 ">
          <div class="flex justify-between items-start">
            <div class="flex flex-col">
              <p class="text-xs text-gray-600 tracking-wide">Trip & Holiday</p>
              <h3 class="mt-1 text-lg text-indigo-500 font-bold">$ 5,918</h3>
              <span class="mt-4 text-xs text-gray-500">Last Transaction 1 Month ago</span>
            </div>
            <div class="bg-indigo-500 p-2 md:p-1 xl:p-2 rounded-md">
              imagen
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Resibos;
