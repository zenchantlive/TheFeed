export default function TermsPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

            <div className="prose dark:prose-invert max-w-none space-y-6">
                <p className="text-muted-foreground">Last Updated: December 2025</p>

                <section>
                    <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using TheFeed, you agree to be bound by these Terms of Service and our Community Guidelines.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">2. Community Guidelines</h2>
                    <p>
                        TheFeed is a neighbor-to-neighbor network. We require all users to treat each other with respect and dignity. Harassment, hate speech, or abuse of any kind will result in immediate account termination.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">3. Food Safety & Liability</h2>
                    <p>
                        TheFeed connects neighbors but does not verify the safety of food shared by individuals. All food is shared &quot;as-is.&quot; Recipients should use their own judgment before consuming shared food. TheFeed is not liable for any illness or injury resulting from the consumption of food shared through the platform, in accordance with the Bill Emerson Good Samaritan Food Donation Act.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">4. User Content</h2>
                    <p>
                        You are responsible for the content you post (events, photos, comments). You grant TheFeed a license to display this content to other users in your local area.
                    </p>
                </section>
            </div>
        </div>
    );
}
