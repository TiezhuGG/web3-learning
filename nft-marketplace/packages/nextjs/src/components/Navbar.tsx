"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Zap, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import WalletConnect from "@/components/wallet/WalletConnect";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="h-[80px] flex items-center sticky top-0 z-50 bg-gray-900/50 backdrop-blur-sm border-b border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-200 bg-clip-text text-transparent">
              NFT Market
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors flex items-center"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Marketplace
            </Link>
            <Link
              href="/mint"
              className="text-gray-300 hover:text-white transition-colors flex items-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              Mint
            </Link>
            <Link
              href="/my-collection"
              className="text-gray-300 hover:text-white transition-colors flex items-center"
            >
              <Package className="w-4 h-4 mr-2" />
              My Collection
            </Link>
          </div>

          <WalletConnect />

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white transition-colors flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Marketplace
              </Link>
              <Link
                href="/mint"
                className="text-gray-300 hover:text-white transition-colors flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Zap className="w-4 h-4 mr-2" />
                Mint
              </Link>
              <Link
                href="/my-collection"
                className="text-gray-300 hover:text-white transition-colors flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Package className="w-4 h-4 mr-2" />
                My Collection
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
