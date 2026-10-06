import csv
import io


def create_csv_response(
    headers: list[str],
    rows: list[list],
):
    output = io.StringIO()

    writer = csv.writer(
        output,
        lineterminator="\n",
    )

    writer.writerow(headers)

    for row in rows:
        writer.writerow(row)

    return output.getvalue()
