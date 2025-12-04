import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { foodBanks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, ExternalLink } from "lucide-react";
import Link from "next/link";
import { EditResourceForm } from "./components/edit-resource-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default async function ProviderDashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect("/");
    }

    // Fetch resources claimed by this user
    const myResources = await db.query.foodBanks.findMany({
        where: eq(foodBanks.claimedBy, session.user.id),
    });

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Provider Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your claimed resources and keep your community information up to date.
                    </p>
                </div>
            </div>

            {myResources.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-background p-4 mb-4 shadow-sm">
                            <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Managed Resources</h3>
                        <p className="text-muted-foreground max-w-md mb-6">
                            You haven&apos;t claimed any resources yet. Find your organization on the map and click &quot;Claim this Listing&quot; to get started.
                        </p>
                        <Button asChild>
                            <Link href="/map">Find My Organization</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {myResources.map((resource) => (
                        <Card key={resource.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{resource.name}</CardTitle>
                                        <CardDescription className="flex items-center mt-1">
                                            <MapPin className="h-3.5 w-3.5 mr-1" />
                                            {resource.address}, {resource.city}, {resource.state}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/resources/${resource.id}`} target="_blank">
                                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                                View Public Page
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                                            <p className="text-sm leading-relaxed">
                                                {resource.description || "No description provided."}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                                                <p className="text-sm">{resource.phone || "N/A"}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Website</h4>
                                                <p className="text-sm truncate">
                                                    {resource.website ? (
                                                        <a href={resource.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                                            {resource.website}
                                                        </a>
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center items-end border-l pl-6">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className="w-full">
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Details
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Edit Resource Details</DialogTitle>
                                                    <DialogDescription>
                                                        Update information for {resource.name}. Changes are published immediately.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <EditResourceForm resource={resource} />
                                            </DialogContent>
                                        </Dialog>
                                        <p className="text-xs text-muted-foreground mt-3 text-center">
                                            Last updated: {resource.updatedAt ? new Date(resource.updatedAt).toLocaleDateString() : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
