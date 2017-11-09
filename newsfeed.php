<?php
    $symbol = $_GET['symbol'];
    $news_array = array();
    $news_query_url = "https://seekingalpha.com/api/sa/combined/{$symbol}.xml";
    const HTTP_BASE_SA = "https://seekingalpha.com/api/1.0";
    $reader = new XMLReader;
    $doc = new DOMDocument;
    
    
    try {
        $reader->open($news_query_url);
        $count = 0;
        
        while (($valid = $reader->read()) && $reader->name !== 'item') ;

        while ($valid) {
            $default = simplexml_import_dom($reader->expand($doc));
            $sa_base = $default->children(HTTP_BASE_SA);
            
            
            $link = (string)$default->link;
            if (strpos($link, 'article') === false) {
                $valid = $reader->next('item');
                continue;
            }
//            var_dump($default);
            
            array_push($news_array, 
				array('title' => (string)$default->title, 'link' => $link, 'pubDate' => substr((string)$default->pubDate, 0, -5) . ' EST', 'author' => (string)$sa_base->author_name)
                );
            
            if (++$count >= 5) break;
            $valid = $reader->next('item');
        }
    }
    catch (Exception $e) {
        echo json_encode(array('error' => 'invalid query'));
    }

    echo(json_encode($news_array, JSON_PRETTY_PRINT));
?>