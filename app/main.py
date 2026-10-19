def calculate_speed(distance, time):
    if distance < 0:
        raise ValueError("Distance cannot be negative.")

    if time <= 0:
        raise ValueError("Time must be greater than zero.")

    return distance / time


def main():
    print("=" * 40)
    print(" INDUSTRIAL ENGINEERING CALCULATOR")
    print("=" * 40)

    try:
        distance = float(input("Enter distance (m): "))
        time = float(input("Enter time (s): "))

        speed = calculate_speed(distance, time)

        print("-" * 40)
        print(f"Calculated speed: {speed:.2f} m/s")
        print("-" * 40)

    except ValueError as error:
        print(f"Input error: {error}")


if __name__ == "__main__":
    main()
