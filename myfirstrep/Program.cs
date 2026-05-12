using System;
using System.Collections.Generic;
using System.Linq;

class BlackjackGame
{
    private List<string> deck = new();
    private List<string> playerHand = new();
    private List<string> dealerHand = new();
    private Random random = new();

    static void Main()
    {
        BlackjackGame game = new();
        game.Play();
    }

    void Play()
    {
        Console.WriteLine("==== Welcome to Blackjack ====");

        bool playAgain = true;
        while (playAgain)
        {
            ResetGame();
            DealInitialCards();
            PrintGameState(false);

            PlayerTurn();

            if (CalculateHand(playerHand) > 21)
            {
                PrintGameState(true);
                Console.WriteLine("BUST! You went over 21! Dealer wins!");
            }
            else
            {
                DealerTurn();
                DetermineWinner();
            }

            Console.WriteLine("\nPlay again? (yes/no): ");
            string input = Console.ReadLine()?.ToLower() ?? "no";
            playAgain = input == "yes" || input == "y";
            Console.WriteLine("\n");
        }

        Console.WriteLine("Thanks for playing!");
    }

    void ResetGame()
    {
        playerHand.Clear();
        dealerHand.Clear();
        deck.Clear();
        CreateDeck();
    }

    void CreateDeck()
    {
        string[] suits = { "♠", "♥", "♦", "♣" };
        string[] values = { "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K" };

        foreach (string suit in suits)
        {
            foreach (string value in values)
            {
                deck.Add(value + suit);
            }
        }

        // Shuffle deck
        for (int i = deck.Count - 1; i > 0; i--)
        {
            int randomIndex = random.Next(i + 1);
            (deck[i], deck[randomIndex]) = (deck[randomIndex], deck[i]);
        }
    }

    void DealInitialCards()
    {
        playerHand.Add(DrawCard());
        dealerHand.Add(DrawCard());
        playerHand.Add(DrawCard());
        dealerHand.Add(DrawCard());
    }

    string DrawCard()
    {
        string card = deck[0];
        deck.RemoveAt(0);
        return card;
    }

    void PrintGameState(bool revealDealer)
    {
        Console.Clear();
        Console.WriteLine("==== Blackjack Table ====");
        Console.WriteLine();
        Console.WriteLine("Dealer:");
        PrintHand(dealerHand, revealDealer);
        Console.WriteLine();
        Console.WriteLine("Player:");
        PrintHand(playerHand, true);
        Console.WriteLine();
    }

    void PrintHand(List<string> hand, bool revealAll)
    {
        var cards = new List<string[]>();
        for (int i = 0; i < hand.Count; i++)
        {
            if (!revealAll && i == 0)
            {
                cards.Add(new[] { "┌───┐", "| ? |", "| ? |", "└───┘" });
            }
            else
            {
                cards.Add(GetCardArt(hand[i]));
            }
        }

        for (int row = 0; row < 4; row++)
        {
            for (int i = 0; i < cards.Count; i++)
            {
                Console.Write(cards[i][row]);
                if (i < cards.Count - 1)
                {
                    Console.Write(" ");
                }
            }
            Console.WriteLine();
        }

        if (revealAll)
        {
            Console.WriteLine("Total: " + CalculateHand(hand));
        }
        else
        {
            int visibleTotal = hand.Skip(1).Sum(card => CardValue(card));
            Console.WriteLine("Total: " + visibleTotal + " + hidden");
        }
    }

    string[] GetCardArt(string card)
    {
        string value = card.Substring(0, card.Length - 1);
        string suit = card.Substring(card.Length - 1);
        string displayValue = value.PadRight(2);

        return new[]
        {
            "┌───┐",
            $"|{displayValue} |",
            $"| {suit} |",
            "└───┘"
        };
    }

    int CardValue(string card)
    {
        string value = card.Substring(0, card.Length - 1);
        if (value == "A") return 11;
        if (value == "K" || value == "Q" || value == "J") return 10;
        return int.Parse(value);
    }

    void PlayerTurn()
    {
        while (true)
        {
            Console.Write("Hit or Stand? (h/s): ");
            string choice = Console.ReadLine()?.ToLower() ?? "s";

            if (choice == "h")
            {
                playerHand.Add(DrawCard());
                PrintGameState(false);
                int total = CalculateHand(playerHand);

                if (total > 21)
                {
                    Console.WriteLine("BUST! You went over 21!");
                    break;
                }
            }
            else if (choice == "s")
            {
                break;
            }
        }
    }

    void DealerTurn()
    {
        Console.WriteLine("\nDealer reveals hand...");
        PrintGameState(true);

        while (CalculateHand(dealerHand) < 17)
        {
            Console.WriteLine("Dealer hits...");
            dealerHand.Add(DrawCard());
            PrintGameState(true);
        }
    }

    void DetermineWinner()
    {
        int playerTotal = CalculateHand(playerHand);
        int dealerTotal = CalculateHand(dealerHand);

        Console.WriteLine("\n--- Results ---");
        Console.WriteLine("Your total: " + playerTotal);
        Console.WriteLine("Dealer total: " + dealerTotal);

        if (playerTotal > 21)
        {
            Console.WriteLine("You BUST! Dealer wins!");
        }
        else if (dealerTotal > 21)
        {
            Console.WriteLine("Dealer BUST! You win!");
        }
        else if (playerTotal > dealerTotal)
        {
            Console.WriteLine("You win!");
        }
        else if (dealerTotal > playerTotal)
        {
            Console.WriteLine("Dealer wins!");
        }
        else
        {
            Console.WriteLine("It's a tie!");
        }
    }

    int CalculateHand(List<string> hand)
    {
        int total = 0;
        int aces = 0;

        foreach (string card in hand)
        {
            string value = card.Substring(0, card.Length - 1);

            if (value == "A")
            {
                total += 11;
                aces++;
            }
            else if (value == "K" || value == "Q" || value == "J")
            {
                total += 10;
            }
            else
            {
                total += int.Parse(value);
            }
        }

        // Adjust for aces if bust
        while (total > 21 && aces > 0)
        {
            total -= 10;
            aces--;
        }

        return total;
    }
}