import wixData from 'wix-data';

$w.onReady(function () {
	$w('#resultsRepeater').hide();

	$w('#resultsRepeater').onItemReady(($item, itemData) => {
		$item('#destTitle').text = itemData.title;
		$item('#text12').text = itemData.description;
	});

	$w('#searchInput').onInput(() => {
		const query = $w('#searchInput').value.trim();
		if (query.length === 0) {
			$w('#resultsRepeater').hide();
			return;
		}
		wixData.query('Destinations')
			.contains('title', query)
			.limit(6)
			.find()
			.then((results) => {
				if (results.items.length > 0) {
					$w('#resultsRepeater').data = results.items;
					$w('#resultsRepeater').show();
				} else {
					$w('#resultsRepeater').hide();
				}
			});
	});
});
