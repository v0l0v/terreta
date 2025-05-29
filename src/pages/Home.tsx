import { Link } from "react-router-dom";
import { MapPin, Plus, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginArea } from "@/components/auth/LoginArea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGeocaches } from "@/hooks/useGeocaches";
import { GeocacheList } from "@/components/GeocacheList";

export default function Home() {
  const { user } = useCurrentUser();
  const { data: geocaches, isLoading } = useGeocaches({ limit: 6 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Desktop Header - Hidden on Mobile */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 hidden md:block">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <MapPin className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">NostrCache</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/map">
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Explore Map
                </Button>
              </Link>
              {user && (
                <Link to="/create">
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Cache
                  </Button>
                </Link>
              )}
              <LoginArea />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 md:py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            Discover Hidden Treasures
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
            Join the decentralized geocaching adventure powered by Nostr. 
            Hide caches, find treasures, and connect with explorers worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link to="/map" className="flex-1 sm:flex-initial">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                <Search className="h-5 w-5 mr-2" />
                Start Exploring
              </Button>
            </Link>
            {user ? (
              <Link to="/create" className="flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Plus className="h-5 w-5 mr-2" />
                  Hide a Cache
                </Button>
              </Link>
            ) : (
              <Button size="lg" variant="outline" disabled className="w-full sm:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Login to Hide Caches
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Why NostrCache?</h3>
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            <Card>
              <CardHeader className="text-center md:text-left">
                <MapPin className="h-10 w-10 text-green-600 mb-4 mx-auto md:mx-0" />
                <CardTitle>Decentralized</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your geocaches are stored on the Nostr network, ensuring they're 
                  always accessible and censorship-resistant.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center md:text-left">
                <Trophy className="h-10 w-10 text-green-600 mb-4 mx-auto md:mx-0" />
                <CardTitle>Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with fellow geocachers, share experiences, and build 
                  lasting friendships through adventure.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center md:text-left">
                <Search className="h-10 w-10 text-green-600 mb-4 mx-auto md:mx-0" />
                <CardTitle>Global Adventure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Discover caches hidden by explorers from around the world, 
                  each with its own unique story and challenge.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Caches */}
      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-2xl md:text-3xl font-bold">Recent Geocaches</h3>
            <Link to="/map" className="hidden sm:block">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="text-center py-8">Loading geocaches...</div>
          ) : geocaches && geocaches.length > 0 ? (
            <>
              <GeocacheList geocaches={geocaches} />
              <div className="mt-6 text-center sm:hidden">
                <Link to="/map">
                  <Button variant="outline" className="w-full">View All Geocaches</Button>
                </Link>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No geocaches found yet. Be the first to hide one!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}